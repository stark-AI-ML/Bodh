-- as i am not settig corn job for this so i will partition for next 5 year.... so need to maybe on automation after 5year :=)

CREATE TABLE news_all_2026_04
PARTITION OF news_all
FOR VALUES FROM ('2026-04-01')
TO ('2026-05-01');



--  partitining for the future : the main one

CREATE OR REPLACE FUNCTION create_monthly_partition(start_date DATE)
RETURNS void AS $$
DECLARE
    end_date DATE := (start_date + INTERVAL '1 month')::DATE;
    partition_name TEXT := 'news_all_' || to_char(start_date, 'YYYY_MM');
    sql TEXT;
BEGIN
    sql := format(
        'CREATE TABLE IF NOT EXISTS %I PARTITION OF news_all
         FOR VALUES FROM (%L) TO (%L);',
        partition_name,
        start_date,
        end_date
    );
    EXECUTE sql;
END;
$$ LANGUAGE plpgsql;



DO $$
DECLARE
    d DATE := '2026-05-01';
BEGIN
    WHILE d < '2031-01-01' LOOP
        PERFORM create_monthly_partition(d);
        d := (d + INTERVAL '1 month')::DATE;
    END LOOP;
END $$;



