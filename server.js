import express from "express";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

app.post("/webhook", (req, res) => {
  const { message } = req.body;

  console.log("Mensaje recibido:", message);

  res.json({
    respuesta: "Soy AutoCliente IA. Pronto integraré Google Calendar y WhatsApp.",
    agendado: false
  });
});

app.get("/", (req, res) => {
  res.send("Backend AutoCliente IA funcionando 🚀");
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
