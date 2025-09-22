import { GoogleSpreadsheet } from 'google-spreadsheet';
import { randomUUID } from 'crypto';

export default async (event, context) => {
  try {
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

    await doc.useServiceAccountAuth(JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON));

    await doc.loadInfo();
    let sheet = doc.sheetsByTitle['Groups'];
    if (!sheet) {
      sheet = await doc.addSheet({ title: 'Groups', headerValues: ['id', 'name', 'createdAt'] });
    }

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
