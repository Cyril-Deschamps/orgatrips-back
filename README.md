# README

# Create user manually

Go into the server and run :
`docker exec -it <container> yarn run user create`

# Conf Secret

### General :

- APP_SECRET: The secret used for the cookies
- APP_MAILJET_PUBLIC_KEY
- APP_MAILJET_PRIVATE_KEY
- APP_MAILJET_SENDER_MAIL
- APP_CORS_ORIGIN: List of the CORS in the shape `http://localhost,http://localhost:3000...`

### For each env :

- branch_APP_DB_HOST: MariaDB Database host
- branch_APP_DB_USER: MariaDB Database user
- branch_APP_DB_PASSWORD: MariaDB Database password
- branch_APP_DB_NAME: MariaDB Database name
- branch_APP_BACKEND_PUBLIC_URL: backend public url
- branch_APP_FRONTEND_PUBLIC_URL: frontend public url
