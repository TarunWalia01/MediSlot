# MediSlot Viva Questions and Answers

## Node.js and Express

1. **What is Node.js?**  
   Node.js is a JavaScript runtime that lets us run JavaScript outside a web browser, including on a server.

2. **Why did MediSlot use Node.js?**  
   It lets the frontend and backend both use JavaScript and has a straightforward ecosystem for REST APIs.

3. **What is Express?**  
   Express is a Node.js framework for defining routes, middleware, and HTTP responses.

4. **What is middleware?**  
   Middleware is a function that runs during a request before the final route handler. MediSlot uses it to parse JSON, authenticate users, and check roles.

5. **What does `express.json()` do?**  
   It parses JSON request bodies and makes the parsed data available as `request.body`.

6. **What is CORS?**  
   CORS is a browser security mechanism that controls which web origins may call a server. MediSlot configures the frontend origin in the backend.

7. **Why use `node --watch`?**  
   It restarts the backend process when files change during development. This project does not use Nodemon.

## REST APIs and HTTP

8. **What is a REST API?**  
   It is a way for clients and servers to exchange resources through HTTP methods and predictable URLs.

9. **What is the difference between GET and POST?**  
   GET reads data; POST submits data to create a resource or perform an operation.

10. **When does MediSlot use PUT and PATCH?**  
    PUT updates a doctor, service, or schedule resource. PATCH is used for a focused change such as cancelling an appointment or changing its status.

11. **What does HTTP 201 mean?**  
    The request successfully created a resource, such as a new patient account or appointment.

12. **What do HTTP 400, 401, 403, 404, and 409 mean here?**  
    They respectively indicate invalid input, missing/invalid authentication, insufficient role, missing resource, and a conflict such as a duplicate or unavailable slot.

13. **Why does the API return JSON?**  
    JSON is a lightweight format that the React frontend and Express backend can exchange easily.

## MongoDB and Mongoose

14. **What is MongoDB?**  
    MongoDB is a document database that stores records as BSON documents in collections.

15. **What is NoSQL?**  
    NoSQL refers to database systems that do not require the traditional relational table model. MongoDB uses documents and collections.

16. **What is a collection?**  
    It is a group of MongoDB documents, broadly similar to a table in a relational database.

17. **What is Mongoose?**  
    Mongoose is an ODM for Node.js that defines schemas and models and provides validation and database query helpers.

18. **What is the difference between a schema and a model?**  
    A schema describes document fields and rules; a model is the interface used to create, query, update, and delete documents.

19. **Why does MediSlot use ObjectId references?**  
    Users, doctors, services, schedules, and appointments are managed independently. References let appointments connect to those records without copying all their data.

20. **What does `populate()` do?**  
    It replaces a referenced ObjectId in a query result with selected fields from the referenced document, such as a doctor's name.

21. **What does embedding mean, and where is it used?**  
    Embedding stores a small related object inside its parent document. Schedule slots and appointment time intervals are embedded because they belong to one schedule or appointment.

22. **What is an index?**  
    An index is a database structure that speeds up selected queries and can enforce uniqueness.

23. **Why is the user email unique?**  
    It prevents multiple user accounts from using the same normalized email address.

24. **What is soft deactivation?**  
    It marks a record inactive instead of deleting it, preserving references and historical appointment information.

## Authentication and security

25. **What is authentication?**  
    Authentication verifies who a user is, for example by checking their email and password at login.

26. **What is authorization?**  
    Authorization decides what an authenticated user is allowed to do, such as restricting doctor management to admins.

27. **What is bcrypt used for?**  
    bcrypt hashes passwords so the database does not store the original password.

28. **Why should passwords be hashed?**  
    If the database is exposed, password hashes do not directly reveal users' original passwords.

29. **What is a JWT?**  
    A JSON Web Token is a signed token that carries claims used by the server to identify an authenticated user.

30. **How does MediSlot send the JWT?**  
    The frontend stores it in `sessionStorage` and Axios sends it as a bearer token in the `Authorization` header.

31. **What is one risk of `sessionStorage`?**  
    Browser JavaScript can read it, so a cross-site scripting vulnerability could expose the token. It is not as protected as an HttpOnly cookie.

32. **What is the difference between 401 and 403?**  
    401 means authentication is missing or invalid; 403 means the user is authenticated but lacks permission.

33. **Why is the admin role not selectable on registration?**  
    Public users must not be able to grant themselves administrator privileges. The first admin is created through a controlled local seed script.

## React and Axios

34. **What is React?**  
    React is a JavaScript library for building user interfaces from reusable components.

35. **What is a React component?**  
    It is a reusable function or class that returns UI based on its inputs and state.

36. **What is React state?**  
    State is data that can change over time and cause a component to re-render, such as a loading indicator or form value.

37. **What is React Router used for?**  
    It maps browser paths to React pages without a full page reload.

38. **What is Axios used for in MediSlot?**  
    Axios sends HTTP requests to the Express API. A request interceptor adds the JWT when a user is signed in.

39. **Why show loading, error, and empty states?**  
    They explain what is happening when data is being fetched, when a request fails, or when there are no records to display.

## MediSlot workflows

40. **How does a patient book an appointment?**  
    The patient selects a doctor, service, date, and available slot. The backend revalidates all of them and creates a pending appointment only if the slot can be claimed.

41. **How does MediSlot help prevent double booking?**  
    It conditionally updates the schedule only when the embedded slot is still unbooked, uses a partial unique appointment index for active exact-start bookings, and runs an interval overlap check.

42. **Why can the backend use a MongoDB transaction?**  
    When the MongoDB topology supports transactions, the appointment insert and schedule-slot claim commit or roll back together.

43. **What happens when an appointment is cancelled or rejected?**  
    The backend changes the status and releases the matching schedule slot, using a transaction when supported and compensating logic otherwise.

44. **How does MediSlot protect patient appointments?**  
    Patient list queries filter by the authenticated patient ID, and individual appointment reads and cancellations check ownership on the backend.

45. **What is the purpose of the clinic timezone setting?**  
    It keeps human-entered clinic dates and working hours consistent while storing actual slot instants as UTC dates.
