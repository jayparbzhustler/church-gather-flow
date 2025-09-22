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
      private_key: private_key.replace(/\\n/g, '\n'),
    });

    await doc.loadInfo();
    let sheet = doc.sheetsByTitle['Groups'];
    if (!sheet) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Groups sheet not found' }),
      };
    }

    const { groupId } = JSON.parse(event.body);
    if (!groupId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Group ID is required' }),
      };
    }

    // Load all rows to find the one to delete
    await sheet.loadCells();
    const rows = await sheet.getRows();
    
    // Find the row with the matching group ID
    const rowIndex = rows.findIndex(row => row.get('id') === groupId);
    if (rowIndex === -1) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'Group not found' }),
      };
    }

    // Delete the row
    await rows[rowIndex].delete();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: 'Group deleted successfully' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};