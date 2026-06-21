-- BRIN index for huge time-series efficiency smaller than BTREE for append-heavy workloads

CREATE INDEX idx_news_broadcast_date_brin
ON news_all
USING BRIN (broadcast_date);

-- Category + sentiment filtering

CREATE INDEX idx_news_category_sentiment
ON news_all (category, sentiment);


-- Location-based filtering

CREATE INDEX idx_news_state_district_date
ON news_all (
    state_id,
    district_id,
    broadcast_date
);


-- GIN index for tags

CREATE INDEX idx_news_tags_gin
ON news_all
USING GIN (tags);


-- Partial GIN index for entities, Saves way more storage if many rows are empty
CREATE INDEX idx_news_entities_gin
ON news_all
USING GIN (entities)
WHERE entities <> '{}';


-- vector based search for headline 
CREATE INDEX idx_news_headline_search
ON news_all
USING GIN (
    to_tsvector('english', headline)
);


-- GIN index for financial data 
CREATE INDEX idx_news_financial_industries
ON news_all
USING GIN (financial_industries jsonb_path_ops);