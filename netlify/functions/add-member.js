import { GoogleSpreadsheet } from 'google-spreadsheet';
import { randomUUID } from 'crypto';

export default async (event, context) => {
  try {
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

    await doc.useServiceAccountAuth(JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON));

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
