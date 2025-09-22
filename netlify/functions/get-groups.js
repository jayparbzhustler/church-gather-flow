import { GoogleSpreadsheet } from 'google-spreadsheet';

export default async (event, context) => {
  try {
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Groups'];

    const rows = await sheet.getRows();
    const groups = rows.map(row => ({
      id: row.get('id'),
      name: row.get('name'),
      createdAt: new Date(row.get('createdAt')),
    }));

    return new Response(JSON.stringify({ groups }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
