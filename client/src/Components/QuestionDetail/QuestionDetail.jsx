import React, { useContext, useEffect, useState } from 'react';
import "./QuestionDetail.css";
import { useParams } from 'react-router-dom';
import { QuestionContext } from '../../Context/QuestionContext';
import axios from "../axios";
import { userProvider } from '../../Context/UserProvider';
import { useForm } from "react-hook-form";

function QuestionDetail() {
  const {
    register,
    trigger,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm();

  const token = localStorage.getItem("token");
  const [user, setUser] = useContext(userProvider);

  const { questions } = useContext(QuestionContext);
  const { questionid } = useParams();
  const [dbAnswer, setdbAnswer] = useState([]);
  
  useEffect(() => {
    async function getAns() {
      try {
        const ans = await axios.get(
          `/answers/all-answers/${questionid}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setdbAnswer(ans.data.data);
      } catch (error) {
        console.log(error);
      }
    }

    if (questionid) {
      getAns();
    }
  }, [questionid, token]);

  const selectedQuestion = questions.find(
    (ques) => ques.questionid === questionid
  );

  async function handleClick(data) {
    try {
      await axios.post(
        "/answers/postanswers",
        {
          answer: data.answer,
          questionid: questionid,
          userid: user.userId,
        },
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        }
      );

      const ans = await axios.get(
        `/answers/all-answers/${questionid}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Update the dbAnswer state with the fetched answers
      setdbAnswer(ans.data.data);
      setValue("answer", ""); // Clear the textarea after posting
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="container top">
      <div className="card mb-4">
        <div className="card-body">
          <h4 className="card-title">Question</h4>
          <h5 className="card-subtitle mb-2 text-muted">{selectedQuestion?.title}</h5>
          <p className="card-text">{selectedQuestion?.description}</p>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h4 className="card-title">Answers From The Community</h4>
        </div>
      </div>

      {dbAnswer.map((answerData, index) => (
        <div className="card mb-3 info_question" key={index}>
          <div className="card-body row">
            <div className="col-md-4 d-flex flex-column align-items-center">
              <i className="fas fa-user-circle fa-3x user mb-2" />
              <p className="username">{answerData.username}</p>
            </div>
            <div className="col-md-8">
              <p className="answer-text">{answerData.answer}</p>
            </div>
          </div>
        </div>
      ))}

      <div className="card answer text-center mb-5">
        <div className="card-body">
          <h2 className="pt-3">Answer The Top Question.</h2>
          <p className="lead mb-3">Share your knowledge and help others</p>

          <form onSubmit={handleSubmit(handleClick)}>
            <div className="form-group">
              <textarea
                className={`form-control w-75 mx-auto ${errors.answer ? "is-invalid" : ""}`}
                rows="6"
                placeholder="Your answer..."
                {...register("answer", {
                  required: "Answer is required",
                  maxLength: {
                    value: 300,
                    message: "Maximum allowed length is 300",
                  },
                })}
                onKeyUp={() => {
                  trigger("answer");
                }}
              />
              {errors.answer && (
                <div className="invalid-feedback">
                  {errors.answer.message}
                </div>
              )}
            </div>
            <button
              type="submit"
              className="btn btn-success mt-3"
            >
              Post Your Answer
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default QuestionDetail;
