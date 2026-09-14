import { Link } from "react-router-dom";

function Landing() {
  return (
    <div className="min-h-screen bg-slate-50">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-200">

        <div>
          <h1 className="text-2xl font-bold text-blue-700">
            VitalCare
          </h1>

          <p className="text-xs text-slate-500">
            Professional Elder Care
          </p>
        </div>

        <div className="flex items-center gap-8 text-sm font-medium text-slate-600">

          <a href="#features" className="hover:text-blue-600">
            Features
          </a>

          <a href="#monitoring" className="hover:text-blue-600">
            AI Monitoring
          </a>

          <a href="#cameras" className="hover:text-blue-600">
            Camera Monitoring
          </a>

          <Link
            to="/login"
            className="px-5 py-2.5 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            Login
          </Link>

        </div>
      </nav>


      {/* Hero Section */}
      <section className="px-8 py-20">

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">

          <div>

            <p className="text-blue-600 font-semibold mb-4">
              AI-POWERED ELDER CARE
            </p>

            <h2 className="text-5xl font-bold leading-tight text-slate-900">

              Smarter Care.
              <br />

              Safer Living.
              <br />

              <span className="text-blue-600">
                Better Aging.
              </span>

            </h2>

            <p className="mt-6 text-lg text-slate-600 leading-relaxed max-w-xl">
              VitalCare Professional combines health monitoring,
              AI-powered safety detection and smart camera monitoring
              to provide better care for elderly people.
            </p>


            <div className="flex gap-4 mt-8">

              <Link
                to="/login"
                className="px-7 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700"
              >
                Get Started
              </Link>

              <a
                href="#features"
                className="px-7 py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-white"
              >
                Explore Features
              </a>

            </div>

          </div>


          {/* Health Monitoring Card */}

          <div className="bg-white rounded-3xl shadow-xl p-8 border border-slate-200">

            <div className="flex justify-between items-center mb-6">

              <div>

                <p className="text-sm text-slate-500">
                  Health Overview
                </p>

                <h3 className="text-xl font-bold text-slate-900">
                  Today's Monitoring
                </h3>

              </div>

              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                ❤️
              </div>

            </div>


            <div className="grid grid-cols-2 gap-4">

              <div className="p-5 bg-red-50 rounded-2xl">

                <p className="text-sm text-slate-500">
                  Heart Rate
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-2">
                  72
                </p>

                <p className="text-xs text-green-600 mt-1">
                  Normal
                </p>

              </div>


              <div className="p-5 bg-blue-50 rounded-2xl">

                <p className="text-sm text-slate-500">
                  SpO₂
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-2">
                  98%
                </p>

                <p className="text-xs text-green-600 mt-1">
                  Normal
                </p>

              </div>


              <div className="p-5 bg-purple-50 rounded-2xl">

                <p className="text-sm text-slate-500">
                  Sleep
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-2">
                  7.5h
                </p>

                <p className="text-xs text-green-600 mt-1">
                  Good
                </p>

              </div>


              <div className="p-5 bg-green-50 rounded-2xl">

                <p className="text-sm text-slate-500">
                  Activity
                </p>

                <p className="text-3xl font-bold text-slate-900 mt-2">
                  Active
                </p>

                <p className="text-xs text-green-600 mt-1">
                  Normal
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* Features Section */}

      <section
        id="features"
        className="px-8 py-20 bg-white"
      >

        <div className="max-w-6xl mx-auto text-center">

          <p className="text-blue-600 font-semibold">
            EVERYTHING IN ONE PLACE
          </p>

          <h2 className="text-3xl font-bold text-slate-900 mt-2">
            Complete Elder Care Management
          </h2>

          <p className="text-slate-500 mt-4 max-w-2xl mx-auto">
            Monitor health, manage care and respond to emergencies
            through one intelligent platform.
          </p>


          <div className="grid md:grid-cols-3 gap-6 mt-12">

            <Feature
              icon="❤️"
              title="Health Monitoring"
              description="Track heart rate, SpO₂, blood pressure, sleep, weight and other health information."
            />

            <Feature
              icon="🤖"
              title="AI Monitoring"
              description="AI-powered fall and inactivity detection helps caregivers respond quickly."
            />

            <Feature
              icon="📹"
              title="Smart Cameras"
              description="Connect multiple cameras and monitor elderly users through live video."
            />

            <Feature
              icon="💊"
              title="Medication Management"
              description="Manage medicines, schedules and reminders from one dashboard."
            />

            <Feature
              icon="🚨"
              title="Emergency SOS"
              description="Quickly notify caregivers and emergency contacts during critical situations."
            />

            <Feature
              icon="👨‍⚕️"
              title="Care Team"
              description="Keep caregivers and family members connected with important updates."
            />

          </div>

        </div>

      </section>


      {/* AI Monitoring Section */}

      <section
        id="monitoring"
        className="px-8 py-20 bg-slate-50"
      >

        <div className="max-w-6xl mx-auto text-center">

          <p className="text-blue-600 font-semibold">
            INTELLIGENT SAFETY
          </p>

          <h2 className="text-3xl font-bold text-slate-900 mt-2">
            AI-Powered Elder Safety
          </h2>

          <p className="text-slate-600 mt-4 max-w-2xl mx-auto">
            VitalCare can analyze camera feeds to identify potential
            falls, inactivity and unusual situations.
          </p>


          <div className="mt-10 bg-white rounded-3xl p-8 shadow-sm border border-slate-200">

            <div className="grid md:grid-cols-3 gap-6">

              <div>

                <div className="text-4xl">
                  🧍
                </div>

                <h3 className="font-bold mt-3">
                  Fall Detection
                </h3>

                <p className="text-sm text-slate-500 mt-2">
                  Detect possible falls using AI-based monitoring.
                </p>

              </div>


              <div>

                <div className="text-4xl">
                  ⏱️
                </div>

                <h3 className="font-bold mt-3">
                  Inactivity Detection
                </h3>

                <p className="text-sm text-slate-500 mt-2">
                  Identify unusual periods of inactivity.
                </p>

              </div>


              <div>

                <div className="text-4xl">
                  🔔
                </div>

                <h3 className="font-bold mt-3">
                  Instant Alerts
                </h3>

                <p className="text-sm text-slate-500 mt-2">
                  Notify caregivers when a safety event is detected.
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* Camera Section */}

      <section
        id="cameras"
        className="px-8 py-20 bg-blue-700 text-white"
      >

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">

          <div>

            <p className="text-blue-200 font-semibold">
              SMART CAMERA MONITORING
            </p>

            <h2 className="text-4xl font-bold mt-3">
              Monitor Multiple Cameras From One Dashboard
            </h2>

            <p className="mt-5 text-blue-100 leading-relaxed">
              Add cameras, view live feeds, record important events,
              review recording history and connect AI safety monitoring.
            </p>

            <Link
              to="/login"
              className="inline-block mt-8 px-7 py-3 rounded-lg bg-white text-blue-700 font-semibold"
            >
              Explore Camera Monitoring
            </Link>

          </div>


          <div className="bg-slate-900 rounded-3xl p-6 shadow-2xl">

            <div className="flex justify-between items-center mb-4">

              <span className="font-semibold">
                Living Room Camera
              </span>

              <span className="text-xs bg-green-500 px-3 py-1 rounded-full">
                ● LIVE
              </span>

            </div>


            <div className="aspect-video bg-slate-800 rounded-2xl flex items-center justify-center">

              <div className="text-center">

                <div className="text-5xl mb-3">
                  📹
                </div>

                <p className="text-slate-400">
                  Live Camera Feed
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>


      {/* Footer */}

      <footer className="px-8 py-8 bg-slate-900 text-slate-400 text-center">

        <p>
          © 2026 VitalCare Professional. AI-Assisted Smart Elder Care.
        </p>

      </footer>

    </div>
  );
}


function Feature({ icon, title, description }) {
  return (
    <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50 text-left hover:shadow-md transition">

      <div className="text-3xl">
        {icon}
      </div>

      <h3 className="text-lg font-bold text-slate-900 mt-4">
        {title}
      </h3>

      <p className="text-sm text-slate-500 mt-2 leading-relaxed">
        {description}
      </p>

    </div>
  );
}

export default Landing;