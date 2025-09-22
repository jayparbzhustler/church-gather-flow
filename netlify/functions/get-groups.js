import { GoogleSpreadsheet } from 'google-spreadsheet';

export default async (event, context) => {
  console.log('get-groups invoked');
  try {
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

    await doc.useServiceAccountCredentials(JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON));

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
    console.error('Error in get-groups:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
