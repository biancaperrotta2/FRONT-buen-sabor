import React from "react";

export const Footer = () => {
  return (
    <footer id="footer">
      {/* PARTE DE REDES */}
      <div className="bg-zinc-900 py-12 flex justify-center gap-10 flex-col items-center ">
        <div className="flex flex-col gap-4 justify-center items-center ">
          <span className="text-xl font-medium tracking-wider text-white hover:scale-110 hover:font-bold transform transition-all duration-300">
            EL BUEN SABOR BURGER´S
          </span>
          <span className="text-sm font-medium tracking-wider text-[#C68F4D] hover:scale-106 hover:font-bold transform transition-all duration-300">
            MAIPU · LÚJAN · GUAYMALLÉN
          </span>
        </div>
        <div className="flex justify-center items-center gap-8">
          <img
            src="/assets/icon/iconoFacebook.svg"
            alt="iconoFacebook"
            className="w-10 h-10 hover:scale-116 transform transition-all duration-300 cursor-pointer"
          />
          <img
            src="/assets/icon/iconoX.svg"
            alt="iconoX"
            className="w-10 h-10 hover:scale-116 transform transition-all duration-300 cursor-pointer"
          />
          <img
            src="/assets/icon/iconoInstagram.svg"
            alt="iconoInstagram"
            className="w-10 h-10 hover:scale-116 transform transition-all duration-300 cursor-pointer"
          />
        </div>
      </div>
      {/* PARTE DE DERECHOS DE AUTOR */}
      <div className="bg-[#1E1E1E] py-10 flex justify-center items-center">
        <span className="text-white tracking-tighter font-sm hover:font-semibold hover:tracking-widest transition-all duration-300 ">
          EL BUEN SABOR 2025 ©
        </span>
      </div>
    </footer>
  );
};

export default Footer;
