CREATE TABLE news_all (

    id BIGSERIAL,

    headline TEXT NOT NULL,
    summary TEXT,

    category news_category NOT NULL,

    impact_scope impact_scope_type NOT NULL,

    importance_score SMALLINT NOT NULL DEFAULT 1
        CHECK (importance_score BETWEEN 1 AND 10),

    sentiment sentiment_type DEFAULT 'Neutral',

    crime_severity crime_severity NOT NULL DEFAULT 'NONE',

    emergency_type emergency_type NOT NULL DEFAULT 'NONE',

    is_national BOOLEAN NOT NULL DEFAULT false,

    state_id BIGINT
        REFERENCES states(id),

    district_id BIGINT
        REFERENCES districts(id),

    -- JSONB metadata
    tags JSONB NOT NULL DEFAULT '[]',

    entities JSONB NOT NULL DEFAULT '{}',

    source_context JSONB NOT NULL DEFAULT '{}',

    -- Financial metadata
    financial_type VARCHAR(50),

    financial_amount NUMERIC(18,2),

    financial_currency VARCHAR(10),

    financial_denomination VARCHAR(20),

    financial_status VARCHAR(50),

    financial_industries JSONB NOT NULL DEFAULT '[]',

    -- Time
    broadcast_date DATE NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT NOW(),

    -- Partitioned tables require partition key in PK
    PRIMARY KEY (id, broadcast_date)
)


PARTITION BY RANGE (broadcast_date);


-- partitioning logic  --- as i am not settingup any automation so...

