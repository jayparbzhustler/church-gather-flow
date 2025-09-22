import { GoogleSpreadsheet } from 'google-spreadsheet';
import { randomUUID } from 'crypto';

export default async (event, context) => {
  try {
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Groups'];

    const { name } = JSON.parse(event.body);

    const newRow = await sheet.addRow({
      id: randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    });

    const newGroup = {
      id: newRow.get('id'),
      name: newRow.get('name'),
      createdAt: new Date(newRow.get('createdAt')),
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ group: newGroup }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
