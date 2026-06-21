CREATE TYPE news_category AS ENUM (
    'Economy',
    'Infrastructure',
    'Politics',
    'Crime',
    'Science',
    'Geopolitics',
    'Emergency'
);

CREATE TYPE impact_scope_type AS ENUM (
    'Local',
    'District',
    'State',
    'National',
    'International'
);

CREATE TYPE crime_severity AS ENUM (
    'NONE',
    'LOW',
    'MODERATE',
    'EXTREME'
);

CREATE TYPE emergency_type AS ENUM (
    'NONE',
    'PUBLIC_HEALTH',
    'NATURAL_DISASTER',
    'WAR_CONFLICT',
    'CIVIL_UNREST'
);

CREATE TYPE sentiment_type AS ENUM (
    'Positive',
    'Neutral',
    'Negative'
);
