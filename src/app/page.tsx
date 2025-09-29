export default function Home() {
  return (
    <div className="min-h-screen bg-red-500">
      <div className="p-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          Tailwind CSS Test
        </h1>
        <div className="bg-blue-500 text-white p-4 rounded-lg mb-4">
          If you can see this blue box, Tailwind CSS is working!
        </div>
        <div className="bg-orange-500 text-white p-4 rounded-lg">
          Orange background test - custom orange colors
        </div>
      </div>
    </div>
  );
}
