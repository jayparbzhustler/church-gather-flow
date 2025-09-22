import { GoogleSpreadsheet } from 'google-spreadsheet';
import { randomUUID } from 'crypto';

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

    const { name, gender, groupId, subgroupId } = JSON.parse(event.body);

    const newRow = await sheet.addRow({
      id: randomUUID(),
      name,
      gender,
      groupId,
      subgroupId,
      createdAt: new Date().toISOString(),
    });

    const newMember = {
      id: newRow.get('id'),
      name: newRow.get('name'),
      gender: newRow.get('gender'),
      groupId: newRow.get('groupId'),
      subgroupId: newRow.get('subgroupId'),
      createdAt: new Date(newRow.get('createdAt')),
    };

    return new Response(JSON.stringify({ member: newMember }), {
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
