"use client";

import { useState, useEffect } from "react";
import { Comment } from "@/types/record";
import { addComment, getCommentsByRecord, deleteComment } from "@/lib/comments";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Send, Trash2, MessageCircle, User } from "lucide-react";

interface CommentSectionProps {
  recordDocId: string;
  readOnly?: boolean;
}

export default function CommentSection({ recordDocId, readOnly = false }: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadComments();
  }, [recordDocId]);

  const loadComments = async () => {
    try {
      const result = await getCommentsByRecord(recordDocId);
      setComments(result);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;

    setSubmitting(true);
    try {
      const comment = await addComment(
        recordDocId,
        user.uid,
        user.displayName || "ユーザー",
        user.photoURL || "",
        text.trim()
      );
      setComments((prev) => [...prev, comment]);
      setText("");
    } catch (error) {
      console.error("Failed to add comment:", error);
      alert("コメントの投稿に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("このコメントを削除しますか？")) return;
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-gray-500" />
        <h3 className="text-sm font-medium text-gray-700">
          コメント {comments.length > 0 && `(${comments.length})`}
        </h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600" />
        </div>
      ) : (
        <div>
          {comments.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-6">
              まだコメントがありません
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {comments.map((comment) => {
                const date = comment.createdAt?.toDate?.() ?? new Date();
                return (
                  <div key={comment.id} className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      {comment.userPhoto ? (
                        <img
                          src={comment.userPhoto}
                          alt=""
                          className="w-7 h-7 rounded-full flex-shrink-0 mt-0.5"
                        />
                      ) : (
                        <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <User className="w-3.5 h-3.5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-gray-700">
                            {comment.userName}
                          </span>
                          <span className="text-xs text-gray-400">
                            {format(date, "M/d HH:mm", { locale: ja })}
                          </span>
                          {user && user.uid === comment.userId && !readOnly && (
                            <button
                              onClick={() => handleDelete(comment.id!)}
                              className="ml-auto text-gray-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5 whitespace-pre-wrap">
                          {comment.text}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Comment input */}
          {!readOnly && user && (
            <form onSubmit={handleSubmit} className="border-t border-gray-100 p-3 flex gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="コメントを入力..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500"
              />
              <button
                type="submit"
                disabled={!text.trim() || submitting}
                className="px-3 py-2 bg-green-600 text-white rounded-lg disabled:opacity-40 transition-colors hover:bg-green-700"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
