podman run -dit --name mongo-note-mark \
-p 27091:27017 \
-v /Users/treblec/Documents/mydata/my903-data/config/mongod.conf:/etc/mongod.conf \
-v /Users/treblec/Documents/mydata/my903-data/data:/data/db \
-v /Users/treblec/Documents/mydata/my903-data/log:/var/log/mongodb \
-e MONGO_INITDB_ROOT_USERNAME=admin \
-e MONGO_INITDB_ROOT_PASSWORD=buwanla \
--restart=always \
mongo 