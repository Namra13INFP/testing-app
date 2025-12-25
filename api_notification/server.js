// server.js
const express = require("express");
const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Initialize firebase-admin only once (safe if module is reloaded)
if (!admin.apps || admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const app = express();
app.use(express.json());

// ---------- HELPERS ----------
async function sendExpoNotifications(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) return { ok: false, reason: "no-tokens" };

  // build messages array
  const messages = tokens.map((t) => ({
    to: t,
    sound: "default",
    title,
    body,
    data,
  }));

  const res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(messages),
  });

  const json = await res.json();
  console.log("Expo send response:", json);

  // json is array of ticket objects — check for errors and remove invalid tokens
  // Each item corresponds to a message in the same order.
  if (Array.isArray(json)) {
    for (let i = 0; i < json.length; i++) {
      const ticket = json[i];
      const token = messages[i].to;
      if (ticket.status === "error") {
        const err = ticket.details?.error;
        console.warn("Expo ticket error for token", token, err);
        // common retryable/non-retryable list: DeviceNotRegistered, MessageTooBig, InvalidCredentials...
        if (err === "DeviceNotRegistered" || err === "InvalidCredentials" || err === "PushNotificationError") {
          await removeInvalidToken(token);
        }
      }
    }
  }
  return json;
}

// remove token from any user doc that has it
async function removeInvalidToken(token) {
  try {
    const usersRef = db.collection("users");
    const q = usersRef.where("expoPushToken", "==", token);
    const snap = await q.get();
    const batch = db.batch();
    snap.forEach((doc) => {
      console.log("Removing invalid token from user:", doc.id);
      batch.update(doc.ref, { expoPushToken: admin.firestore.FieldValue.delete() });
    });
    await batch.commit();
  } catch (err) {
    console.error("Failed to remove invalid token:", err);
  }
}

async function getTokensByRole(role) {
  const snap = await db.collection("users").where("role", "==", role).get();
  const tokens = [];
  snap.forEach((d) => {
    const t = d.data().expoPushToken;
    if (t) tokens.push(t);
  });
  return tokens;
}

async function getTokenForUid(uid) {
  const doc = await db.collection("users").doc(uid).get();
  if (!doc.exists) return null;
  const data = doc.data();
  return (data && data.expoPushToken) || null;
}

// ---------- ENDPOINTS (matches your flows) ----------

// CUSTOMER -> ADMIN: new request created
app.post("/request/new", async (req, res) => {
  try {
    const { requestId } = req.body; // requestId == request title (doc id)
    if (!requestId) return res.status(400).send("requestId required");

    const reqSnap = await db.collection("requests").doc(requestId).get();
    if (!reqSnap.exists) return res.status(404).send("request not found");
    const request = reqSnap.data();
    if (!request) return res.status(500).send("request data missing");
    if (!request) return res.status(404).send("request data not found");
    const requestName = request.title || requestId;

    const adminTokens = await getTokensByRole("admin");
    const title = "New Request";
    const body = `${requestName} booked`;

    const expoRes = await sendExpoNotifications(adminTokens, title, body, { requestId });
    res.json({ success: true, expoRes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// CUSTOMER -> ADMIN: customer paid full amount
app.post("/request/paidFull", async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).send("requestId required");

    const reqSnap = await db.collection("requests").doc(requestId).get();
    if (!reqSnap.exists) return res.status(404).send("request not found");
    const request = reqSnap.data();
    if (!request) return res.status(500).send("request data missing");
    const requestName = request.title || requestId;

    const adminTokens = await getTokensByRole("admin");
    const title = "Payment Received";
    const body = `${requestName} amount paid`;

    const expoRes = await sendExpoNotifications(adminTokens, title, body, { requestId });
    res.json({ success: true, expoRes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// ADMIN -> CUSTOMER : accepted
app.post("/request/accepted", async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).send("requestId required");
    const reqSnap = await db.collection("requests").doc(requestId).get();
    if (!reqSnap.exists) return res.status(404).send("request not found");
    const request = reqSnap.data();
    if (!request) return res.status(500).send("request data missing");
    const requestName = request.title || requestId;
    const customerToken = await getTokenForUid(request.userId);

    if (!customerToken) return res.status(400).send("customer has no token");

    const title = "Request Accepted";
    const body = `${requestName} accepted`;

    const expoRes = await sendExpoNotifications([customerToken], title, body, { requestId });
    res.json({ success: true, expoRes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// ADMIN -> CUSTOMER : rejected
app.post("/request/rejected", async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).send("requestId required");
    const reqSnap = await db.collection("requests").doc(requestId).get();
    if (!reqSnap.exists) return res.status(404).send("request not found");
    const request = reqSnap.data();
    if (!request) return res.status(500).send("request data missing");
    const requestName = request.title || requestId;
    const customerToken = await getTokenForUid(request.userId);

    if (!customerToken) return res.status(400).send("customer has no token");

    const title = "Request Rejected";
    const body = `${requestName} rejected`;

    const expoRes = await sendExpoNotifications([customerToken], title, body, { requestId });
    res.json({ success: true, expoRes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// ADMIN -> CUSTOMER : completed
app.post("/request/completed", async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).send("requestId required");
    const reqSnap = await db.collection("requests").doc(requestId).get();
    if (!reqSnap.exists) return res.status(404).send("request not found");
    const request = reqSnap.data();
    if (!request) return res.status(500).send("request data missing");
    const requestName = request.title || requestId;
    const customerToken = await getTokenForUid(request.userId);

    if (!customerToken) return res.status(400).send("customer has no token");

    const title = "Request Completed";
    const body = `${requestName} completed`;

    const expoRes = await sendExpoNotifications([customerToken], title, body, { requestId });
    res.json({ success: true, expoRes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// EMPLOYEE -> ADMIN & CUSTOMER : single item completed
app.post("/employee/itemCompleted", async (req, res) => {
  try {
    const { requestId, itemKey } = req.body; // itemKey: food|drinks|capacity|location
    if (!requestId || !itemKey) return res.status(400).send("requestId & itemKey required");

    const reqSnap = await db.collection("requests").doc(requestId).get();
    if (!reqSnap.exists) return res.status(404).send("request not found");
    const request = reqSnap.data();
    if (!request) return res.status(500).send("request data missing");
    const requestName = request.title || requestId;

    const title = `${itemKey} Completed`;
    const body = `${requestName} ${itemKey} status completed`;

    const adminTokens = await getTokensByRole("admin");
    const customerToken = await getTokenForUid(request.userId);
    const allTokens = [...adminTokens];
    if (customerToken) allTokens.push(customerToken);

    const expoRes = await sendExpoNotifications(allTokens, title, body, { requestId, itemKey });
    res.json({ success: true, expoRes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// EMPLOYEE -> ADMIN & CUSTOMER : all items completed
app.post("/employee/allItemsCompleted", async (req, res) => {
  try {
    const { requestId } = req.body;
    if (!requestId) return res.status(400).send("requestId required");

    const reqSnap = await db.collection("requests").doc(requestId).get();
    if (!reqSnap.exists) return res.status(404).send("request not found");
    const request = reqSnap.data();
    if (!request) return res.status(500).send("request data missing");
    const requestName = request.title || requestId;

    const adminTokens = await getTokensByRole("admin");
    const customerToken = await getTokenForUid(request.userId);

    const adminTitle = "Employee Completed Job";
    const adminBody = `Employee completed ${requestName}`;

    const customerTitle = "Pay Full Amount";
    const customerBody = `Pay full amount of ${requestName}`;

    const adminRes = await sendExpoNotifications(adminTokens, adminTitle, adminBody, { requestId });
    const customerRes = customerToken ? await sendExpoNotifications([customerToken], customerTitle, customerBody, { requestId }) : null;

    res.json({ success: true, adminRes, customerRes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

// Generic send endpoint
app.post("/send", async (req, res) => {
  try {
    const { tokens, title, body, data } = req.body;
    if (!tokens || tokens.length === 0) return res.status(400).send("tokens required");
    const expoRes = await sendExpoNotifications(tokens, title, body, data || {});
    res.json({ success: true, expoRes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
