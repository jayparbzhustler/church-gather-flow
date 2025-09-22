const { GoogleSpreadsheet } = require('google-spreadsheet');

module.exports.handler = async (event, context) => {
  console.log('get-groups invoked');
  console.log('google-spreadsheet version:', require('google-spreadsheet/package.json').version);
  try {
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

    // Use separate environment variables for Google Service Account
    const client_email = process.env.GOOGLE_CLIENT_EMAIL;
    const private_key = process.env.GOOGLE_PRIVATE_KEY;
    
    if (!client_email || !private_key) {
      throw new Error('Google Service Account credentials not found in environment variables');
    }

    await doc.useServiceAccountAuth({
      client_email: client_email,
      private_key: private_key,
    });

    await doc.loadInfo();
    let sheet = doc.sheetsByTitle['Groups'];
    if (!sheet) {
      sheet = await doc.addSheet({ title: 'Groups', headerValues: ['id', 'name', 'createdAt'] });
    }

    const rows = await sheet.getRows();
    const groups = rows.map(row => ({
      id: row.id,
      name: row.name,
      createdAt: new Date(row.createdAt),
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
