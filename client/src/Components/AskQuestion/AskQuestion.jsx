import DOMPurify from 'dompurify';
import React, { useContext, useMemo, useRef } from 'react';
import { useForm } from "react-hook-form";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { v4 as uuidv4 } from 'uuid';
import { userProvider } from '../../Context/UserProvider';
import axios from "../../axios";
import "./AskQuestion.css";
import { toast } from 'react-toastify';
import BackButton from '../BackButton/BackButton';

function AskQuestion() {
  const {
    register,
    trigger,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm();

  const { user } = useContext(userProvider);
  const token = localStorage.getItem("token");
  const quillRef = useRef(null);

  // Configure Quill modules
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'color': [] }, { 'background': [] }],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: function() {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();

          input.onchange = async () => {
            const file = input.files[0];
            if (file) {
              const formData = new FormData();
              formData.append('image', file);

              try {
                const response = await axios.post('/upload-image', formData, {
                  headers: {
                    'Content-Type': 'multipart/form-data',
                    'Authorization': `Bearer ${localStorage.getItem("token")}`
                  }
                });

                if (response.data && response.data.url) {
                  const quill = this.quill;
                  const range = quill.getSelection(true);
                  // Get the base URL without the /api suffix
                  const baseUrl = axios.defaults.baseURL.replace('/api', '');
                  const fullImageUrl = `${baseUrl}${response.data.url}`;
                  quill.insertEmbed(range.index, 'image', fullImageUrl);
                } else {
                  console.error('Invalid response format:', response.data);
                }
              } catch (error) {
                console.error('Error uploading image:', error);
                // Show error to user
                // alert('Failed to upload image. Please try again.');
                toast.error('Failed to upload image. Please try again.');
              }
            }
          };
        }
      }
    }
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'blockquote', 'code-block',
    'list', 'bullet',
    'color', 'background',
    'link', 'image'
  ];

  async function handlePost(data) {
    const questionId = uuidv4();
    try {
      // Sanitize HTML content
      const sanitizedDescription = DOMPurify.sanitize(data.question);
      
      await axios.post(
        "/questions/post",
        {
          tag: data.tag,
          title: data.title,
          description: sanitizedDescription,
          questionId: questionId,
          userId: user.userId,
        },
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );
      
      toast.success("Question posted successfully!");
      // Reset form after successful post
      reset();
    } catch (error) {
      toast.error(error.response?.data?.msg || "Failed to post question. Please try again.");
      console.error("Error posting question:", error.response || error);
    }
  }

  return (
    <div className="top container text-center">
      <div className="py-5">
        <BackButton />
        <h2>Steps to Write a Good Question</h2>
        <ol className="text-start mx-auto" style={{ maxWidth: "450px" }}>
          <li>Add a more precise tag about the question type.</li>
          <li>Summarize your problem in a one-line title.</li>
          <li>Describe your problem in more detail.</li>
          <li>Describe what you tried and what you expected to happen.</li>
          <li>Review your question and post it to the site.</li>
        </ol>
      </div>
      <div>
        <h2 className="pb-2">Ask a Public Question</h2>
        <form onSubmit={handleSubmit(handlePost)}>
          <div className="d-flex flex-column align-items-center mb-4">
            <textarea
              placeholder="Tag"
              className={`w-75 tag-area pt-2 ps-2 ${errors.tag ? "invalid" : ""}`}
              rows="2"
              {...register("tag", {
                required: "Tag is required.",
                minLength: {
                  value: 3,
                  message: "Minimum tag length is 3",
                },
              })}
              onKeyUp={() => trigger("tag")}
            />
            {errors.tag && <small className="text-danger">{errors.tag.message}</small>}
          </div>
          <div className="d-flex flex-column align-items-center mb-4">
            <textarea
              className={`w-75 pt-2 ps-2 ${errors.title ? "invalid" : ""}`}
              rows="2"
              placeholder="Title"
              {...register("title", {
                required: "Title is required",
                maxLength: {
                  value: 200,
                  message: "Maximum length is 200",
                },
              })}
              onKeyUp={() => trigger("title")}
            />
            {errors.title && <small className="text-danger">{errors.title.message}</small>}
          </div>
          <div className="rich-text-editor">
            <ReactQuill
              ref={quillRef}
              theme="snow"
              modules={modules}
              formats={formats}
              value={watch("question") || ""}
              onChange={(content) => {
                setValue("question", content);
                trigger("question");
              }}
              placeholder="Question Description..."
              className={`w-75 mx-auto ${errors.question ? "invalid" : ""}`}
              preserveWhitespace={true}
            />
            {errors.question && <small className="text-danger">{errors.question.message}</small>}
          </div>
          <div>
            <button
              type="submit"
              className="btn btn-success mb-5 mt-3"
            >
              Post Your Question
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AskQuestion;
