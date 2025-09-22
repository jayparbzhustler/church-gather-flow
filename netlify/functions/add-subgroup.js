import { GoogleSpreadsheet } from 'google-spreadsheet';
import { randomUUID } from 'crypto';

export default async (event, context) => {
  try {
    const doc = new GoogleSpreadsheet(process.env.SHEET_ID);

    await doc.useServiceAccountAuth(JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON));

    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['Subgroups'];

    const { name, groupId } = JSON.parse(event.body);

    const newRow = await sheet.addRow({
      id: randomUUID(),
      name,
      groupId,
      createdAt: new Date().toISOString(),
    });

    const newSubgroup = {
      id: newRow.get('id'),
      name: newRow.get('name'),
      groupId: newRow.get('groupId'),
      createdAt: new Date(newRow.get('createdAt')),
    };

    return new Response(JSON.stringify({ subgroup: newSubgroup }), {
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
