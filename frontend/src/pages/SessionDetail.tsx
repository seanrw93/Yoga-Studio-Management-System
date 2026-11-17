import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { isCancel } from "axios";
import { sessionService } from "../services/sessions.service";
import { Session } from "../types";
import { useAuth } from "../context/AuthProvider";
import { getErrorMessage } from "../utils/errors";

function SessionDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const sessionId = Number(id);
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // Bump to refetch after joining/leaving
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const load = async (): Promise<void> => {
      try {
        setLoading(true);
        setError("");
        setSession(await sessionService.getById(sessionId, controller.signal));
      } catch (err: unknown) {
        if (isCancel(err)) return;
        setError(getErrorMessage(err, "Failed to load session details"));
        console.error(err);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [sessionId, reloadKey]);

  const handleParticipate = async (): Promise<void> => {
    if (!user) return;
    try {
      await sessionService.participate(sessionId);
      setReloadKey((k) => k + 1);
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Failed to join session"));
      console.error(err);
    }
  };

  const handleUnparticipate = async (): Promise<void> => {
    if (!user) return;
    try {
      await sessionService.unparticipate(sessionId);
      setReloadKey((k) => k + 1);
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Failed to leave session"));
      console.error(err);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!window.confirm("Are you sure you want to delete this session?")) {
      return;
    }

    try {
      await sessionService.delete(sessionId);
      navigate("/sessions");
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Failed to delete session"));
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading session...</div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error || "Session not found"}
        </div>
      </div>
    );
  }

  const isParticipating = user ? session.users.includes(user.id) : false;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            {session.name}
          </h1>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Details
            </h2>
            <div className="space-y-2 text-gray-600">
              <p>
                <strong>Date:</strong>{" "}
                {new Date(session.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p>
                <strong>Teacher:</strong> {session.teacher.firstName}{" "}
                {session.teacher.lastName}
              </p>
              <p>
                <strong>Participants:</strong> {session.users.length}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              Description
            </h2>
            <p className="text-gray-600 whitespace-pre-wrap">
              {session.description}
            </p>
          </div>

          <div className="flex space-x-4">
            {user?.admin ? (
              <>
                <button
                  onClick={() => navigate(`/sessions/edit/${id}`)}
                  className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              </>
            ) : (
              <>
                {isParticipating ? (
                  <button
                    onClick={handleUnparticipate}
                    className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
                  >
                    Leave Session
                  </button>
                ) : (
                  <button
                    onClick={handleParticipate}
                    className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
                  >
                    Join Session
                  </button>
                )}
              </>
            )}

            <button
              onClick={() => navigate("/sessions")}
              className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400"
            >
              Back to Sessions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SessionDetail;
