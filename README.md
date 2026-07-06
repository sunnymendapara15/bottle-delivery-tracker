# Bottle Delivery Tracker

This small project helps capture how many bottles the vendor drops off each day and provides monthly totals so you can reconcile the monthly payment without manual spreadsheets.

## Prerequisites
- [.NET 8 SDK](https://dotnet.microsoft.com/en-us/download)
- [Node.js 18+](https://nodejs.org/) and npm

## Backend
1. `cd backend`
2. `dotnet restore`
3. `dotnet run`

The minimal API listens on `http://localhost:5041` (and `https://localhost:7044`). The SQLite database file `deliveries.db` is created next to the executable automatically.

## Frontend
1. `cd frontend`
2. `npm install`
3. `REACT_APP_API_BASE_URL=http://localhost:5041 npm start`

The React app connects to the backend using `REACT_APP_API_BASE_URL`. If your API is running on a different port or host, set the environment variable before starting the front-end server.
