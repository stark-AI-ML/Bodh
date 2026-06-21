CREATE TABLE states (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE districts (
    id BIGSERIAL PRIMARY KEY,

    state_id BIGINT NOT NULL
        REFERENCES states(id)
        ON DELETE CASCADE,

    name VARCHAR(100) NOT NULL,

    UNIQUE(state_id, name)
);