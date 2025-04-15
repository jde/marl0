FROM postgres:latest

COPY ./init.sql /bootstrap/init.sql
COPY ./entrypoint.sh /bootstrap/entrypoint.sh

RUN chmod +x /bootstrap/entrypoint.sh

ENTRYPOINT ["/bootstrap/entrypoint.sh"]
