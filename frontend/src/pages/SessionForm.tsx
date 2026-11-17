import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { isCancel } from "axios";
import { sessionService } from "../services/sessions.service";
import { teacherService } from "../services/teacher.service";
import { Teacher, SessionFormData } from "../types";
import { useAuth } from "../context/AuthProvider";
import { getErrorMessage } from "../utils/errors";

// teacherId is "" until a teacher is picked in the select
type SessionFormState = Omit<SessionFormData, "teacherId"> & {
  teacherId: number | "";
};

function SessionForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState<SessionFormState>({
    name: "",
    date: "",
    description: "",
    teacherId: "",
  });
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if not admin
  useEffect(() => {
    if (!user?.admin) {
      navigate("/sessions");
    }
  }, [user, navigate]);

  useEffect(() => {
    const controller = new AbortController();

    const loadTeachers = async (): Promise<void> => {
      try {
        setTeachers(await teacherService.getAll(controller.signal));
      } catch (err: unknown) {
        if (isCancel(err)) return;
        console.error("Failed to fetch teachers", err);
      }
    };

    const loadSession = async (): Promise<void> => {
      try {
        const session = await sessionService.getById(
          Number(id),
          controller.signal,
        );
        setFormData({
          name: session.name,
          date: new Date(session.date).toISOString().split("T")[0],
          description: session.description,
          teacherId: session.teacher.id,
        });
      } catch (err: unknown) {
        if (isCancel(err)) return;
        setError(getErrorMessage(err, "Failed to load session"));
        console.error(err);
      }
    };

    loadTeachers();
    if (isEditMode) loadSession();

    return () => controller.abort();
  }, [id, isEditMode]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "teacherId" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>,
  ): Promise<void> => {
    e.preventDefault();
    if (formData.teacherId === "") return;

    setError("");
    setLoading(true);

    const payload: SessionFormData = {
      ...formData,
      teacherId: formData.teacherId,
    };

    try {
      if (isEditMode) {
        await sessionService.update(Number(id), payload);
      } else {
        await sessionService.create(payload);
      }
      navigate("/sessions");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save session"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-8">
            {isEditMode ? "Edit Session" : "Create New Session"}
          </h1>

          {error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          ) : null}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="session-name"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Session Name
              </label>
              <input
                id="session-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="session-date"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Date
              </label>
              <input
                id="session-date"
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="session-teacher"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Teacher
              </label>
              <select
                id="session-teacher"
                name="teacherId"
                value={formData.teacherId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                required
              >
                <option value="">Select a teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.firstName} {teacher.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label
                htmlFor="session-description"
                className="block text-gray-700 text-sm font-bold mb-2"
              >
                Description
              </label>
              <textarea
                id="session-description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
              >
                {loading
                  ? "Saving..."
                  : isEditMode
                    ? "Update Session"
                    : "Create Session"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/sessions")}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SessionForm;
