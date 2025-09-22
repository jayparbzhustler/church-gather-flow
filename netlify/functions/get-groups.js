import { GoogleSpreadsheet } from 'google-spreadsheet';

export default async (event, context) => {
  console.log('get-groups invoked');
  try {
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

    await doc.useServiceAccountAuth(JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON));

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Groups'];

    const rows = await sheet.getRows();
    const groups = rows.map(row => ({
      id: row.get('id'),
      name: row.get('name'),
      createdAt: new Date(row.get('createdAt')),
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ groups }),
    };
  } catch (error) {
    console.error('Error in get-groups:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
