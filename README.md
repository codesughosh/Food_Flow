# FoodFlow

FoodFlow is an Indian food ordering and queue management system using:

- HTML5
- CSS3
- Bootstrap 5
- Vanilla JavaScript
- Node.js
- Express
- MongoDB
- Mongoose

The backend is fully implemented with Node.js, Express, MongoDB, and Mongoose.

## Run Locally

Install dependencies:

```powershell
npm.cmd install --cache .npm-cache
```

Create `.env` from `.env.example`:

```powershell
copy .env.example .env
```

Start MongoDB locally, then seed the database:

```powershell
npm run seed
```

For a local database, keep this in `.env`:

```text
MONGODB_URI=mongodb://127.0.0.1:27017/foodflow
```

For MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string.

Run the app:

```powershell
npm start
```

Open:

```text
http://127.0.0.1:8080/index.html
```

## Admin Login

After seeding:

```text
Email: admin@foodflow.in
Password: Admin@123
```

## API Endpoints

- `GET /api/health`
- `GET /api/categories`
- `GET /api/foods`
- `GET /api/foods/:slug`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/:orderNumber`
- `POST /api/contact`
- `GET /api/admin/summary`
- `PATCH /api/admin/orders/:id/status`
