using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Windows.Forms;
using OpenTK;
using System.IO;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using static System.Windows.Forms.VisualStyles.VisualStyleElement;
using System.Runtime.InteropServices.ComTypes;
using System.Threading.Tasks;
using OpenTK.Graphics.OpenGL;

namespace КГ_Лаб3_Трассировка_лучей
{
    public partial class Form1 : Form
    {
        int BasicProgramID;
        int BasicVertexShader;
        int BasicFragmentShader;
        Vector4 CubeColor;
        Vector3 CameraPosition;
        float Mirror;
        int Depth;
        int Rotation = 1;
        public Form1()
        {
            InitializeComponent();
        }

        private void Form1_Load(object sender, EventArgs e)
        {

        }

        void loadShader(String filename, ShaderType type, int program, out int address)
        {
            address = GL.CreateShader(type);
            using (System.IO.StreamReader sr = new System.IO.StreamReader(filename))
            {
                GL.ShaderSource(address, sr.ReadToEnd());
            }
            GL.CompileShader(address);
            GL.AttachShader(program, address);
            Console.WriteLine(GL.GetShaderInfoLog(address));
        }

        void InitShader()
        {
            BasicProgramID = GL.CreateProgram();
            loadShader("C:\\Users\\User\\source\\repos\\КГ Лаб3 Трассировка лучей\\raytracing.vert", ShaderType.VertexShader, BasicProgramID,
            out BasicVertexShader);
            loadShader("C:\\Users\\User\\source\\repos\\КГ Лаб3 Трассировка лучей\\raytracing.frag", ShaderType.FragmentShader, BasicProgramID,
            out BasicFragmentShader);
            GL.LinkProgram(BasicProgramID);
            int status = 0;
            GL.GetProgram(BasicProgramID, GetProgramParameterName.LinkStatus, out status);
            Console.WriteLine(GL.GetProgramInfoLog(BasicProgramID));
        }

        private static bool Init()
        {
            GL.Enable(EnableCap.ColorMaterial);
            GL.ShadeModel(ShadingModel.Smooth);

            GL.Enable(EnableCap.DepthTest);
            GL.Enable(EnableCap.CullFace);

            GL.Enable(EnableCap.Lighting);
            GL.Enable(EnableCap.Light0);

            GL.Hint(HintTarget.PerspectiveCorrectionHint, HintMode.Nicest);

            return true;
        }

        private void DrawingShader()
        {
            GL.ClearColor(Color.AliceBlue);
            GL.Clear(ClearBufferMask.ColorBufferBit | ClearBufferMask.DepthBufferBit);
            GL.UseProgram(BasicProgramID);
            GL.Uniform4(GL.GetUniformLocation(BasicProgramID, "cube_color"), CubeColor);
            GL.Uniform3(GL.GetUniformLocation(BasicProgramID, "camera_position"), CameraPosition);
            GL.Uniform1(GL.GetUniformLocation(BasicProgramID, "reflector"), Mirror);
            GL.Uniform1(GL.GetUniformLocation(BasicProgramID, "DEPTH"), Depth);
            GL.Uniform1(GL.GetUniformLocation(BasicProgramID, "rotation"), Rotation);

            GL.BlendFunc(BlendingFactor.SrcAlpha, BlendingFactor.OneMinusSrcAlpha);
            GL.Enable(EnableCap.Blend);

            GL.Color4(255, 255, 255, 0.5);
            GL.Begin(PrimitiveType.Quads);

            GL.TexCoord2(0, 1);
            GL.Vertex2(-1, -1);

            GL.TexCoord2(1, 1);
            GL.Vertex2(1, -1);

            GL.TexCoord2(1, 0);
            GL.Vertex2(1, 1);

            GL.TexCoord2(0, 0);
            GL.Vertex2(-1, 1);

            GL.End();

            glControl1.SwapBuffers();
            GL.UseProgram(0);
        }

        private void glControl1_Load(object sender, EventArgs e)
        {
            Init();
            InitShader();
        }

        private void trackBar1_Scroll(object sender, EventArgs e)
        {
            CubeColor.X = trackBar1.Value / 255f;
            glControl1.Invalidate();
        }

        private void trackBar2_Scroll(object sender, EventArgs e)
        {
            CubeColor.Y = trackBar2.Value / 255f;
            glControl1.Invalidate();
        }

        private void trackBar3_Scroll(object sender, EventArgs e)
        {
            CubeColor.Z = trackBar3.Value / 255f;
            glControl1.Invalidate();
        }

        private void trackBar4_Scroll(object sender, EventArgs e)  // mirror
        {
            Mirror = trackBar4.Value / 10f;
            glControl1.Invalidate();
        }

        private void trackBar5_Scroll(object sender, EventArgs e)
        {
            CubeColor.W = trackBar5.Value / 10f;
            glControl1.Invalidate();
        }

        private void trackBar6_Scroll(object sender, EventArgs e)
        {
            Depth = trackBar6.Value;
            glControl1.Invalidate();
        }

        private void Form1_SizeChanged(object sender, EventArgs e)
        {
            glControl1.Update();
        }

        private void glControl1_SizeChanged(object sender, EventArgs e)
        {
            glControl1.Update();
        }

        private void glControl1_KeyPress(object sender, System.Windows.Forms.KeyPressEventArgs e)
        {
            if (e.KeyChar == 'a' && CameraPosition.X > -5) { CameraPosition.X -= Rotation * 0.1f; glControl1.Invalidate(); }
            else if (e.KeyChar == 'd' && CameraPosition.X < 5) { CameraPosition.X += Rotation * 0.1f; glControl1.Invalidate(); }
            else if (e.KeyChar == 'u' && CameraPosition.Y > -5) { CameraPosition.Y -= Rotation * 0.1f; glControl1.Invalidate(); }
            else if (e.KeyChar == ' ' && CameraPosition.Y < 5) { CameraPosition.Y += Rotation * 0.1f; glControl1.Invalidate(); }
            else if (e.KeyChar == 's' && CameraPosition.Z > -5) { CameraPosition.Z -= Rotation * 0.1f; glControl1.Invalidate(); }
            else if (e.KeyChar == 'w' && CameraPosition.Z < 5) { CameraPosition.Z += Rotation * 0.1f; glControl1.Invalidate(); }
            else if ((e.KeyChar == 'b' && Rotation > 0) || (e.KeyChar == 'f' && Rotation < 0)) { Rotation *= -1; glControl1.Invalidate(); }
            else return;
        }

        private void glControl1_Paint(object sender, PaintEventArgs e)
        {
            DrawingShader();
        }
    }
}
