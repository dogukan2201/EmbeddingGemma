import { useState, useEffect } from "react";
import { useEmbedding } from "./hooks/useEmbedding";
import "./App.css";

const DOCS = [
  {
    id: "d1",
    text: "Mars is known for its reddish surface and is referred to as the 'Red Planet'.",
  },
  {
    id: "d2",
    text: "Jupiter is the largest planet in the Solar System and has the Great Red Spot.",
  },
  {
    id: "d3",
    text: "Saturn's most striking feature is its vast rings that surround it.",
  },
  {
    id: "d4",
    text: "Venus is similar in size to Earth and is known for its dense atmosphere.",
  },
  {
    id: "d5",
    text: "Mercury is the closest planet to the Sun and experiences extreme temperature variations.",
  },
  {
    id: "d6",
    text: "Mars is often called the Red Planet due to its reddish appearance.",
  },
  {
    id: "d7",
    text: "There is a massive volcano called Olympus Mons on the surface of Mars.",
  },
  {
    id: "d8",
    text: "The largest volcano in the solar system, Olympus Mons, is located on Mars.",
  },
  {
    id: "d9",
    text: "Uranus and Neptune are commonly referred to as ice giants.",
  },
  {
    id: "d10",
    text: "Jupiter's moon Europa may harbor an ocean beneath its icy surface.",
  },
];

const App = () => {
  const [query, setQuery] = useState(
    "Which planet is known as the Red Planet?"
  );
  const [documents, setDocuments] = useState<string[]>(() => {
    const savedDocs = localStorage.getItem("embedding_documents");
    return savedDocs ? JSON.parse(savedDocs) : DOCS.map((doc) => doc.text);
  });
  const [newDocument, setNewDocument] = useState("");

  const {
    isModelLoading,
    isModelReady,
    modelError,
    isProcessing,
    results,
    runEmbeddingQuery,
    clearResults,
  } = useEmbedding();

  const handleRunEmbedding = async () => {
    console.log(
      "Button clicked. Model ready:",
      isModelReady,
      "Model loading:",
      isModelLoading
    );
    try {
      const storedDocuments = localStorage.getItem("embedding_documents");
      const documentsToUse = storedDocuments
        ? JSON.parse(storedDocuments)
        : documents;

      console.log(
        "Documents retrieved from localStorage for the model:",
        documentsToUse
      );
      await runEmbeddingQuery(query, documentsToUse);
    } catch (error) {
      console.error("Embedding error:", error);
    }
  };

  const handleAddDocument = () => {
    if (newDocument.trim()) {
      const updatedDocuments = [...documents, newDocument.trim()];

      // Update state
      setDocuments(updatedDocuments);

      // Update localStorage directly
      localStorage.setItem(
        "embedding_documents",
        JSON.stringify(updatedDocuments)
      );
      console.log(
        "New document added and localStorage updated:",
        updatedDocuments
      );

      setNewDocument("");
    }
  };

  const handleRemoveDocument = (index: number) => {
    const updatedDocuments = documents.filter((_, i) => i !== index);

    // Update state
    setDocuments(updatedDocuments);

    // Update localStorage directly
    localStorage.setItem(
      "embedding_documents",
      JSON.stringify(updatedDocuments)
    );
    console.log("Document deleted and localStorage updated:", updatedDocuments);
  };

  // Dokümanlar değiştiğinde localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem("embedding_documents", JSON.stringify(documents));
    console.log("Documents saved to localStorage:", documents);
  }, [documents]);

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>🔍 Embedding Gemma - Semantic Search</h1>

      {/* Model Status */}
      <div
        style={{
          marginBottom: "20px",
          padding: "10px",
          border: "1px solid #ddd",
          borderRadius: "5px",
          color: isModelReady
            ? "#155724"
            : isModelLoading
            ? "#856404"
            : "#721c24",
          backgroundColor: isModelReady
            ? "#d4edda"
            : isModelLoading
            ? "#fff3cd"
            : "#f8d7da",
        }}
      >
        <strong>Model Status: </strong>
        {isModelLoading && "⏳ Loading model..."}
        {isModelReady && "✅ Model ready"}
        {modelError && `❌ Error: ${modelError}`}
      </div>

      {/* Show loading message when model is loading */}
      {isModelLoading && (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            fontSize: "18px",
            color: "#666",
          }}
        >
          <div style={{ marginBottom: "20px", fontSize: "48px" }}>⏳</div>
          <p>Model loading, please wait...</p>
          <p style={{ fontSize: "14px", color: "#888" }}>
            This process may take a few minutes
          </p>
        </div>
      )}

      {/* Hide all other content when model is loading */}
      {!isModelLoading && (
        <>
          {/* Query Input */}
          <div style={{ marginBottom: "20px" }}>
            <h3>Search Query</h3>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter your search query here..."
              style={{ width: "100%", height: "60px", padding: "10px" }}
            />
          </div>

          {/* Documents Management */}
          <div style={{ marginBottom: "20px" }}>
            <h3>Documents ({documents.length})</h3>

            {/* Add new document */}
            <div style={{ marginBottom: "10px", display: "flex", gap: "10px" }}>
              <textarea
                value={newDocument}
                onChange={(e) => setNewDocument(e.target.value)}
                placeholder="Add new document..."
                style={{ flex: 1, height: "40px", padding: "10px" }}
              />
              <button
                onClick={handleAddDocument}
                disabled={!newDocument.trim()}
              >
                Add
              </button>
            </div>

            {/* Document list */}
            <div style={{ display: "grid", gap: "10px" }}>
              {documents.map((doc, index) => (
                <div
                  key={index}
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ flex: 1 }}>{doc}</span>
                  <button
                    onClick={() => handleRemoveDocument(index)}
                    style={{ marginLeft: "10px", color: "red" }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Run Embedding Button */}
          <div style={{ marginBottom: "20px" }}>
            <button
              onClick={handleRunEmbedding}
              disabled={!isModelReady || isProcessing || documents.length === 0}
              style={{
                padding: "10px 20px",
                fontSize: "16px",
                backgroundColor:
                  isModelReady && !isProcessing ? "#007bff" : "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor:
                  isModelReady && !isProcessing ? "pointer" : "not-allowed",
              }}
            >
              {isProcessing ? "⏳ Processing..." : "🚀 Run Embedding"}
            </button>

            {results && (
              <button
                onClick={clearResults}
                style={{
                  marginLeft: "10px",
                  padding: "10px 20px",
                  fontSize: "16px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                }}
              >
                Clear Results
              </button>
            )}
          </div>

          {/* Results Display */}
          {results && (
            <div style={{ marginTop: "20px" }}>
              <h3>🎯 Results</h3>

              <div
                style={{
                  marginBottom: "15px",
                  padding: "10px",
                  backgroundColor: "#3c4043",
                  color: "white",
                  borderRadius: "5px",
                }}
              >
                <strong>Query:</strong> {results.query}
              </div>

              <h4>Most Relevant Documents:</h4>
              <div style={{ display: "grid", gap: "10px" }}>
                {results.ranking.map((item, rank) => (
                  <div
                    key={item.index}
                    style={{
                      padding: "15px",
                      border: "1px solid #444",
                      borderRadius: "5px",
                      backgroundColor:
                        rank === 0
                          ? "#2c3e50"
                          : rank === 1
                          ? "#34495e"
                          : "#3c4043",
                      color: "white",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "10px",
                      }}
                    >
                      <strong style={{ color: "white" }}>#{rank + 1}</strong>
                      <span
                        style={{
                          padding: "4px 8px",
                          backgroundColor: "#007bff",
                          color: "white",
                          borderRadius: "3px",
                          fontSize: "14px",
                        }}
                      >
                        Score: {item.score.toFixed(4)}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: "white" }}>{item.text}</p>
                  </div>
                ))}
              </div>

              <details style={{ marginTop: "15px" }}>
                <summary style={{ cursor: "pointer", fontWeight: "bold" }}>
                  Raw Similarity Scores
                </summary>
                <pre
                  style={{
                    backgroundColor: "#f8f9fa",
                    padding: "10px",
                    borderRadius: "5px",
                    overflow: "auto",
                  }}
                >
                  {JSON.stringify(results.similarities, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;
