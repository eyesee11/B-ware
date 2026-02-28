# B-ware : No Lies Told

## An AI-Powered Facts and Claims checker ML model which verifies the possibility and error percentage of the claim being made by the user.

### Step 1 - Basic Structure Outline

```
project
│   README.md   
└───backend/
    ├── package.json          
    ├── node_modules/         
    ├── .env                  
    ├── .gitignore            
    ├── server.js             
    ├── config/
    │   └── db.js             ← database connection setup
    ├── routes/
    │   └── (empty for now)   ← API route files will go here
    ├── controllers/
    │   └── (empty for now)   ← business logic will go here
    └── middleware/
        └── (empty for now)   ← auth checks, error handlers will go here
|
|
└───frontend
    │   (to be filled)
└───database
    │   schema.sql
└───nlp-service
    │   soon
```
   

### Step 2 - Database Designing

1> We created the base model structure of the MVP product, and decided the main tables to be used.
2> Those being USERS, CLAIMS, Official_data_cache, Verification_log.
3> Tried caching some of the basic calculation part to make the retrieval faster.