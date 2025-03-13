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

// Habilitar CORS (opcional, pero recomendado si el frontend y backend están en orígenes distintos)
app.use(cors());

// Middleware para servir archivos estáticos desde la carpeta 'public'
app.use(express.static('public'));
app.use(express.json());

// Ruta para obtener la respuesta de OpenAI
app.post('/getBotResponse', async (req, res) => {
    const { message } = req.body;

    // Leer el archivo system_prompt.js para obtener el contenido del prompt
    const systemPromptPath = path.join(__dirname, 'public', 'system_prompt.js');
    let systemPrompt = '';
    try {
        systemPrompt = fs.readFileSync(systemPromptPath, 'utf8');
    } catch (error) {
        console.error("Error al leer el archivo system_prompt.js", error);
        return res.status(500).json({ error: "No se pudo cargar el prompt del sistema." });
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
                model: "gpt-4o-mini", // Verifica que estás usando el modelo correcto
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: message }
                ]
            })
        });
        
        const data = await response.json();
        if (data.choices && data.choices[0] && data.choices[0].message) {
            res.json({ reply: data.choices[0].message.content });
        } else {
            res.status(500).json({ error: "No se pudo obtener una respuesta válida." });
        }
    } catch (error) {
        console.error("Error al obtener respuesta de OpenAI:", error);
        res.status(500).json({ error: "Hubo un problema al obtener la respuesta." });
    }
});

// Inicia el servidor
app.listen(port, () => {
    console.log(`Servidor en http://localhost:${port}`);
});
