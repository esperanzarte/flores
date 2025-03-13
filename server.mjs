import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

// Definir __filename y __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Habilitar CORS y parseo de JSON
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde 'public'
app.use(express.static('public'));

// --- Caching del system_prompt ---
// Leer el archivo system_prompt.js una sola vez al iniciar el servidor.
const systemPromptPath = path.join(__dirname, 'public', 'system_prompt.js');
let systemPrompt = '';
try {
    systemPrompt = fs.readFileSync(systemPromptPath, 'utf8');
    console.log('System prompt cargado correctamente.');
} catch (error) {
    console.error("Error al leer system_prompt.js:", error);
}

const userChatHistory = {};
const MAX_HISTORY_LENGTH = 10;

app.post('/getBotResponse', async (req, res) => {
    const { message, userId } = req.body;
    if (!userId) {
        return res.status(400).json({ error: "Se requiere un userId." });
    }

    // Validar que se haya cargado el systemPrompt
    if (!systemPrompt) {
        return res.status(500).json({ error: "No se pudo cargar el prompt del sistema." });
    }

    // Inicializar historial del usuario si no existe
    if (!userChatHistory[userId]) {
        userChatHistory[userId] = [{ role: "system", content: systemPrompt }];
    }

    // Si el mensaje es "reiniciar", limpiar el historial
    if (message.toLowerCase() === "reiniciar") {
        userChatHistory[userId] = [{ role: "system", content: systemPrompt }];
        return res.json({ reply: "Historial reiniciado. ¿En qué puedo ayudarte?" });
    }

    // Agregar el mensaje del usuario al historial
    userChatHistory[userId].push({ role: "user", content: message });

    // Limitar el historial a los últimos MAX_HISTORY_LENGTH mensajes
    if (userChatHistory[userId].length > MAX_HISTORY_LENGTH) {
        userChatHistory[userId] = userChatHistory[userId].slice(-MAX_HISTORY_LENGTH);
    }

    const API_KEY = process.env.OPENAI_API_KEY;

    try {
        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "gpt-4o-mini", // Asegúrate de usar un modelo válido
                messages: userChatHistory[userId]
            })
        });

        // Verificar si la respuesta fue exitosa
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Error de OpenAI API:", errorText);
            return res.status(response.status).json({ error: "Error en la API de OpenAI." });
        }

        const data = await response.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const botReply = data.choices[0].message.content;
            // Agregar respuesta del bot al historial
            userChatHistory[userId].push({ role: "assistant", content: botReply });
            return res.json({ reply: botReply });
        } else {
            return res.status(500).json({ error: "No se pudo obtener una respuesta válida." });
        }
    } catch (error) {
        console.error("Error al obtener respuesta de OpenAI:", error);
        return res.status(500).json({ error: "Hubo un problema al obtener la respuesta." });
    }
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor en http://localhost:${port}`);
});
