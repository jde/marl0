FROM ollama/ollama

rebuild: validate pull-llm-model
	$(DC) build --no-cache
	$(DC) up -d --force-recreate


# entrypoint will pull the model(s) at build time
#  if they do not exist locally
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"]
