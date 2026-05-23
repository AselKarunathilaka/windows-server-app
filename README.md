# InternSync

InternSync is a modern, enterprise-grade Intern Management System designed with a stunning Liquid Glassmorphism UI. It is built to seamlessly track and manage intern profiles, providing rich analytics and PDF export capabilities.

## 🚀 Features

- **Liquid UI/UX**: A state-of-the-art, fully responsive frontend featuring animated gradients, floating elements, and deep glassmorphism effects.
- **Analytics Dashboard**: Real-time visualization of intern metrics, categorized by university and specialization.
- **Advanced Filtering**: Filter the directory by name, ID, or specific IT specializations.
- **PDF Export**: Instantly export custom-filtered intern directory reports to PDF.
- **Full CRUD API**: A robust Spring Boot backend to register, update, delete, and view intern records.
- **Network Ready**: Built-in dynamic IP routing so the frontend automatically adapts to network deployments without hardcoded IPs.

## 🛠 Tech Stack

**Frontend:**
- React (Vite)
- Tailwind CSS
- Recharts (Data Visualization)
- jsPDF & jsPDF-AutoTable (PDF Generation)
- React Router DOM

**Backend:**
- Java 21
- Spring Boot
- Spring Data MongoDB
- Maven

**Database:**
- MongoDB Atlas (Cloud)

## ⚙️ Prerequisites

- **Java 21** or higher
- **Maven 3.9** or higher
- **Node.js** (latest LTS)

## 🏃‍♂️ How to Run Locally

### 1. Backend (Spring Boot)

The backend requires a valid MongoDB connection string to start.

Open a PowerShell terminal, navigate to the `backend` directory, and set the `MONGODB_URI` environment variable before running:

```powershell
cd backend
$env:MONGODB_URI="mongodb+srv://asel:aselwin12@cluster0.7lpjxrq.mongodb.net/deployment_lab_db?retryWrites=true&w=majority"
mvn clean package
mvn spring-boot:run
```

The backend API will start on `http://localhost:19090`.

### 2. Frontend (React / Vite)

Open a new terminal and navigate to the `frontend` directory:

```powershell
cd frontend
npm install
npm run dev
```

The application will be accessible at `http://localhost:15173`.

## 📦 Production Deployment (Windows IIS)

InternSync is specifically configured to be deployed on a Windows Server using IIS.

1. **Backend**: Compile the Spring Boot backend using `mvn clean package` and run the resulting `.jar` file on your server. Ensure the `MONGODB_URI` environment variable is set on the Windows Server.
2. **Frontend**: Inside the `frontend` directory, run:
   ```powershell
   npm run build
   ```
3. **IIS Hosting**: This will generate an optimized `dist` folder. Copy the contents of this folder directly to your IIS site directory.
4. **Automatic Routing**: Because the frontend uses dynamic API routing, it will automatically route API requests to port `19090` of your Windows Server's IP address!
