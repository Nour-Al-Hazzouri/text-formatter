export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header with handwritten font */}
        <header className="text-center mb-12">
          <h1 className="text-6xl font-handwritten text-orange-800 mb-4 animate-fade-in">
            Text Formatter
          </h1>
          <p className="text-xl font-serif text-orange-700 max-w-2xl mx-auto">
            Transform messy, plain text notes into well-structured, readable formats using intelligent pattern recognition.
          </p>
        </header>

        {/* Demo notebook pages */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Input notebook page */}
          <div className="notebook-paper notebook-shadow p-8 rounded-lg notebook-torn-top">
            <div className="notebook-binding w-8 h-full absolute left-0 top-0 rounded-l-lg"></div>
            <div className="ml-12">
              <h2 className="text-2xl font-handwritten text-notebook-ink mb-6">
                Raw Notes
              </h2>
              <div className="space-y-4 font-serif text-notebook-ink">
                <p className="text-sm opacity-75">Meeting with team about new project...</p>
                <p className="text-sm opacity-75">TODO: Review designs</p>
                <p className="text-sm opacity-75">Call Sarah about budget</p>
                <p className="text-sm opacity-75">Deadline: Friday</p>
              </div>
            </div>
          </div>

          {/* Output notebook page */}
          <div className="notebook-paper notebook-shadow-lifted p-8 rounded-lg notebook-torn-top animate-fade-up">
            <div className="notebook-binding w-8 h-full absolute left-0 top-0 rounded-l-lg animate-spiral-rotate"></div>
            <div className="ml-12">
              <h2 className="text-2xl font-handwritten text-notebook-ink mb-6">
                Formatted Output
              </h2>
              <div className="space-y-4 font-serif text-notebook-ink">
                <h3 className="font-semibold text-orange-700">Meeting Notes</h3>
                <p className="text-sm">• Team discussion: New project</p>
                <h3 className="font-semibold text-orange-700 mt-4">Action Items</h3>
                <p className="text-sm">□ Review designs</p>
                <p className="text-sm">□ Call Sarah about budget</p>
                <p className="text-sm text-orange-600 font-semibold">⏰ Deadline: Friday</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: "Meeting Notes", icon: "📝", desc: "Extract agenda items and action items" },
            { title: "Task Lists", icon: "✅", desc: "Organize todos with priorities" },
            { title: "Journal Notes", icon: "📖", desc: "Structure thoughts and insights" },
          ].map((feature) => (
            <div key={feature.title} className="notebook-paper notebook-shadow p-6 rounded-lg hover:notebook-shadow-lifted transition-shadow">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="text-xl font-handwritten text-orange-800 mb-2">{feature.title}</h3>
              <p className="font-serif text-notebook-ink text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
