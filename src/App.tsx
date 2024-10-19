import axios from "axios";
import { useState, useEffect} from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import InputMask from "react-input-mask";
import './css/App.css'

interface FormData {
  phone: string;
  code?: string;
}


export default function App() {
  const { register, handleSubmit, formState: { errors }, getValues} = useForm<FormData>({
    mode: "onBlur",
    reValidateMode: "onBlur"
  });
  const [codeRequested, setcodeRequested] = useState<boolean>(false);
  const [timer, setTimer] = useState<number>(60); 
  const [isTimerActive, setTimerActive] = useState<boolean>(false);

  useEffect(() => {
    if (isTimerActive && timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);

      return () => clearInterval(interval);
    } else if (timer === 0) {
      setTimerActive(false); 
    }
  }, [isTimerActive, timer]);


  const onSubmit: SubmitHandler<FormData> = async (data) => {
    try {
      await axios.post('https://shift-backend.onrender.com/auth/otp', { phone: data.phone })
      setcodeRequested(true)
      setTimer(60); 
      setTimerActive(true);
    }
    catch (error) {
      console.error("Error requesting OTP: ", error);
    }
  }


  const onSubmitCode: SubmitHandler<FormData> = async (data) => {
    try {
      const res = await axios.post('https://shift-backend.onrender.com/users/signin', { phone: data.phone, code: data.code })
      try {
        const sessionResponse = await axios.get(`https://shift-backend.onrender.com/users/session`, {
          headers: {
            Authorization: `Bearer ${res.data.token}`
          }
        })
        console.log(sessionResponse.data.user)
      }
      catch (error) {
        console.error("Error fetching session: ", error);
      }
    }
    catch (error) {
      console.error("Error signing in: ", error);
    }
  }

  return (
    <section className="section">
      <p className="enter-title">Вход</p>
      {codeRequested ?
          <p className="text">Введите проверочный код для входа в личный кабинет</p>
          :
          <p className="text">Введите номер телефона для входа в личный кабинет</p>
        }
      <form className="form" onSubmit={codeRequested  ? handleSubmit(onSubmitCode) : handleSubmit(onSubmit)}>
        <div style={{display:"flex", flexDirection: "column", gap:"10px"}}>
          <div>
            {errors.phone && <p className="error-message">Поле является обязательным</p>}
            <InputMask
              className="input"
              style={errors.phone && {borderColor:"red"}}
              type="tel"
              mask="+7 (999) 999-99-99" 
              placeholder="Телефон"
              {...register("phone", { required: true, pattern: /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/})} 
            />
          </div>
          {codeRequested &&
          <>
            <div>
              {errors.code && <p className="error-message">Код должен содержать 6 цифр</p>}
              <input 
              className="input"
              style={errors.code && {borderColor:"red"}}
              type="text" 
              placeholder="Проверочный код"
              {...register("code", { required: true, pattern: /^\d{6}$/ })}
              />
            </div>
          </>
          }
        </div>
        <div className="blockOfButtons">
          <input className="button" type="submit" value={codeRequested ? "Войти" : "Продолжить"} />
          {codeRequested &&
            <>
              {isTimerActive ? (
                <p className="timer-text">Запросить новый код можно будет через: {timer} секунд</p>
              ) : (
                <p className="retry" onClick={async () => {const FormData = getValues();  await onSubmit(FormData); }}>Запросить код еще раз</p>)}
            </>
          }
        </div>
      </form>

    </section>
  )
}


