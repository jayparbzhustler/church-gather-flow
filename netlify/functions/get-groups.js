const { GoogleSpreadsheet } = require('google-spreadsheet');

module.exports.handler = async (event, context) => {
  console.log('get-groups invoked');
  console.log('google-spreadsheet version:', require('google-spreadsheet/package.json').version);
  try {
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

    const creds = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
    await doc.useServiceAccountAuth({
      client_email: creds.client_email,
      private_key: creds.private_key.replace(/\\n/g, '\n'),
    });

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
