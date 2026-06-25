import pool from '../DB/postgres/dbConfig.js';

async function insertNews(news) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    let stateId = null;
    let districtId = null;

    if (news.location?.state) {
      const stateRes = await client.query(
        `
        INSERT INTO states (name)
        VALUES ($1)
        ON CONFLICT (name)
        DO UPDATE SET name = EXCLUDED.name
        RETURNING id
        `,
        [news.location.state]
      );

      stateId = stateRes.rows[0].id;
    }

    if (news.location?.district && stateId) {
      const districtRes = await client.query(
        `
        INSERT INTO districts (state_id, name)
        VALUES ($1, $2)
        ON CONFLICT (state_id, name)
        DO UPDATE SET name = EXCLUDED.name
        RETURNING id
        `,
        [stateId, news.location.district]
      );

      districtId = districtRes.rows[0].id;
    }

    const broadcastDate = new Date();
    const dateOnly = broadcastDate.toISOString().split('T')[0];

    const res = await client.query(
      `
      INSERT INTO news_all (
        headline,
        summary,
        category,
        impact_scope,
        importance_score,
        sentiment,
        crime_severity,
        emergency_type,
        is_national,
        state_id,
        district_id,
        tags,
        entities,
        source_context,
        financial_type,
        financial_amount,
        financial_currency,
        financial_denomination,
        financial_status,
        financial_industries,
        broadcast_date
      )
      VALUES (
        $1,$2,$3,$4,
        $5,$6,$7,$8,
        $9,$10,$11,
        $12,$13,$14,
        $15,$16,$17,$18,
        $19,$20,
        $21
      )
      RETURNING id
      `,
      [
        news.headline,
        news.summary,
        news.category,
        news.impact_scope,
        news.importance_score,
        news.sentiment,
        news.crime_severity || 'NONE',
        news.emergency_type || 'NONE',
        news.location?.is_national ?? false,
        stateId,
        districtId,
        JSON.stringify(news.tags || []),
        JSON.stringify(news.entities || {}),
        JSON.stringify(news.source_context || {}),
        news.financials?.type || null,
        news.financials?.amount || null,
        news.financials?.currency || null,
        news.financials?.denomination || null,
        news.financials?.status || null,
        JSON.stringify(news.financials?.industry || []),
        dateOnly,
      ]
    );

    await client.query('COMMIT');

    console.log('Inserted news ID:', res.rows[0].id);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error inserting news item:', error);
  } finally {
    client.release();
  }
}

export default insertNews;

// test
// await insertNews(data[4]);
