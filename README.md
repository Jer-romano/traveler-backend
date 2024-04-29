# Backend for TravelBuddy Capstone

### See the deployed site [here:](https://travel-haircut.surge.sh/)

This backend uses Express to handle requests from the frontend such as trip creation, user creation and log in, trip fetching, and more. The backend is comprised of the following folders:

#### db-schema
Contains a (slightly outdated) diagram of the database schema.

#### helpers
Contains a token generator function. This token is sent back to the user upon successful signup/login.

#### middleware
Contains authentication functions. One to authenticate JWTs. Another to ensure a user is logged in. 

#### models
JavaScript classes for accessing the database. One class for users, another for trips. Each class contains methods for basic CRUD operations.

#### routes
Specific endpoints for the backend, including authentication, users, and trips. These endpoints use many of the methods defined in the model classes.

#### schemas
JSON schema files for validating things such as new trips and new users.

#### app.js
All the routes are tied together here. We also specify a generic error handler.

#### expressError.js
Various types of errors are defined here, all extending JS' Error class. 

