import { GoogleSpreadsheet } from 'google-spreadsheet';

export default async (event, context) => {
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
    const sheet = doc.sheetsByTitle['Members'];

    const rows = await sheet.getRows();
    const members = rows.map(row => ({
      id: row.get('id'),
      name: row.get('name'),
      gender: row.get('gender'),
      groupId: row.get('groupId'),
      subgroupId: row.get('subgroupId'),
      createdAt: new Date(row.get('createdAt')),
    }));

    return new Response(JSON.stringify({ members }), {
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
