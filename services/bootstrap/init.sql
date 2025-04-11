DO
$$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'marl0') THEN
      CREATE ROLE marl0 LOGIN PASSWORD 'marl0';
   END IF;
END
$$;
