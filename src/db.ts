import { Pool } from "pg"; 

const pool: InstanceType<typeof Pool> = new Pool ({
    user: 'postgres' ,
    host: 'test_postgres01',
    database: 'sample_db01',
    password: 'm92fm4a1mws',
    port: 5432,
});

export default pool;