### Backup Data on regular basis


**Disclamer**

*you or anyone shouldn't be writing the migration file manually until and unless you designed it perfectly from very begening and that's what i thaugh but later did add many columns* i.e `ALTER TABLE` 

- so make sure to use migration tool from very start 
- if you hadn't done that **don't panic** just use `pg_dump` explained below as baseline of your migration
- there are many migration tools availabel like: `dbmate`, `prisma`, `flyway` and other cloud based migration by    `aws and gcp`
  
  
- I used ``dbmate`` simple lightweight opensource free


### pg_dump

In postgress you can get backup by using pg_dump which simply is -> postgress dump

##

## How to perform that

Full code example :

` pg_dump -U postgres -h localhost -p 5432 --schema-only news > schema.sql`

- `-U ` : represents username -> default postgres
- `-h` : server host from where you are accessing these files
- `-p` : port number -> default `5432` for postgres
- `--schema-only` : flags what you want to dump --> `data `, `schema`, `data+schema`, `indexes `
- `news` : database name
- `schema.sql` : output file naem

You can see the result of this under DB/schema.sql

| Purpose          | Command Example                           | Notes                   | metaInfo          |
| ---------------- | ----------------------------------------- | ----------------------- | ----------------- |
| Full backup      | `pg_dump mydb > backup.sql`               | Includes schema + data  |
| Schema only      | `pg_dump --schema-only mydb > schema.sql` | No data, just structure |
| Data only        | `pg_dump --data-only mydb > data.sql`     | Inserts without schema  |
| Specific table   | `pg_dump -t users mydb > users.sql`       | Dumps only one table    |
| With compression | `pg_dump mydb`                            | gzip > backup.sql.gz`   | Smaller file size |
| Restore psql     | `-U myuser -d newdb -f backup.sql`        | Apply dump to target DB |
