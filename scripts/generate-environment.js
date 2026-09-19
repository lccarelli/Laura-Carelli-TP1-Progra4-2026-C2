require('dotenv').config();
const fs = require('fs');
const path = require('path');

const contenido = `export const environment = {
  SUPABASE_URL: '${process.env.SUPABASE_URL}',
  SUPABASE_KEY: '${process.env.SUPABASE_KEY}',
  PROFESOR_EMAIL: '${process.env.PROFESOR_EMAIL}',
  PROFESOR_PASSWORD: '${process.env.PROFESOR_PASSWORD}',
};
`;

const carpeta = path.join(__dirname, '..', 'src', 'environments');
fs.writeFileSync(path.join(carpeta, 'environment.ts'), contenido);

console.log('environment.ts generado desde .env');
