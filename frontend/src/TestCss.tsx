// src/TestCss.tsx
const TestCss = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold text-primary mb-6">CSS Test Page</h1>
      
      <div className="space-y-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Colors Test</h2>
          <div className="flex space-x-2">
            <div className="w-12 h-12 bg-primary rounded"></div>
            <div className="w-12 h-12 bg-secondary rounded"></div>
            <div className="w-12 h-12 bg-red-500 rounded"></div>
            <div className="w-12 h-12 bg-green-500 rounded"></div>
            <div className="w-12 h-12 bg-yellow-500 rounded"></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Typography Test</h2>
          <p className="text-sm text-gray-600">Small text</p>
          <p className="text-base text-gray-700">Base text</p>
          <p className="text-lg text-gray-800">Large text</p>
          <p className="text-xl font-bold text-gray-900">Extra large bold text</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Buttons Test</h2>
          <div className="flex space-x-4">
            <button className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90">
              Primary Button
            </button>
            <button className="px-4 py-2 bg-secondary text-white rounded hover:bg-secondary/90">
              Secondary Button
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">
              Outline Button
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Grid Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-primary/10 p-4 rounded">Column 1</div>
            <div className="bg-secondary/10 p-4 rounded">Column 2</div>
            <div className="bg-green-100 p-4 rounded">Column 3</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestCss;