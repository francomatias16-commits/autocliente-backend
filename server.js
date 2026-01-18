import express from "express";
import fetch from "node-fetch";
import { google } from "googleapis";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

// Cliente OAuth de Google
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

// Scopes necesarios para Calendar
const SCOPES = ["https://www.googleapis.com/auth/calendar"];

/* ------------------------------------------------------
   RUTA RAÍZ (para despertar Render)
------------------------------------------------------ */
app.get("/", (req, res) => {
  res.send("Backend AutoCliente IA funcionando 🚀");
});

/* ------------------------------------------------------
   RUTA PARA INICIAR AUTORIZACIÓN CON GOOGLE
------------------------------------------------------ */
app.get("/auth", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  res.redirect(url);
});

/* ------------------------------------------------------
   CALLBACK DE GOOGLE (cuando aceptás permisos)
------------------------------------------------------ */
app.get("/auth/callback", async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    res.send(
      "✅ Autorización completada. Ya puedes usar Google Calendar con AutoCliente IA."
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("Error en autorización");
  }
});

/* ------------------------------------------------------
   FUNCIÓN PARA CREAR EVENTO EN TU CALENDARIO
------------------------------------------------------ */
async function crearEventoEnCalendar(fechaISO) {
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const evento = {
    summary: "Turno - AutoCliente IA",
    description: "Turno generado automáticamente por tu asistente.",
    start: {
      dateTime: fechaISO,
      timeZone: "America/Argentina/Buenos_Aires",
    },
    end: {
      dateTime: new Date(
        new Date(fechaISO).getTime() + 60 * 60 * 1000
      ).toISOString(),
      timeZone: "America/Argentina/Buenos_Aires",
    },
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    resource: evento,
  });

  return response.data;
}

/* ------------------------------------------------------
   WEBHOOK PARA MENSAJES (TU PANEL / FUTURO WHATSAPP)
------------------------------------------------------ */
app.post("/webhook", async (req, res) => {
  const mensaje = req.body.message || "";

  let respuesta = "";

  // Detección simple de "turno"
  if (mensaje.toLowerCase().includes("turno")) {
    // Tomamos mañana a las 10 como ejemplo por defecto
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + 1);
    fecha.setHours(10, 0, 0, 0);

    try {
      const evento = await crearEventoEnCalendar(fecha.toISOString());

      respuesta =
        "✅ Turno creado en tu Google Calendar para mañana a las 10. " +
        "Podés verlo en tu app de Google Calendar.";
    } catch (err) {
      console.error(err);
      respuesta =
        "⚠️ Quise crear el turno, pero todavía no autorizaste Google Calendar. " +
        "Entrá primero a /auth.";
    }
  } else {
    respuesta =
      "Hola, soy AutoCliente IA. Puedo agendar turnos si me lo pedís 🙂";
  }

  res.json({ respuesta });
});

/* ------------------------------------------------------
   INICIAR SERVIDOR
------------------------------------------------------ */
app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
