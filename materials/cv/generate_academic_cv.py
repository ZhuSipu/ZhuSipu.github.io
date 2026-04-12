from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import Indenter, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


OUT = "materials/cv/academic_cv.pdf"
CONTENT_INDENT = 0.28 * inch
DATE_COL_WIDTH = 2.5 * inch

doc = SimpleDocTemplate(
    OUT,
    pagesize=letter,
    leftMargin=0.5 * inch,
    rightMargin=0.5 * inch,
    topMargin=0.38 * inch,
    bottomMargin=0.38 * inch,
)

styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="Name",
        fontName="Times-Bold",
        fontSize=22,
        leading=24,
        alignment=TA_CENTER,
        spaceAfter=1,
    )
)
styles.add(
    ParagraphStyle(
        name="Contact",
        fontName="Times-Roman",
        fontSize=10.2,
        leading=12,
        alignment=TA_CENTER,
        spaceAfter=7,
    )
)
styles.add(
    ParagraphStyle(
        name="Section",
        fontName="Times-Bold",
        fontSize=13.2,
        leading=14.2,
        alignment=TA_LEFT,
        spaceBefore=5,
        spaceAfter=2,
    )
)
styles.add(
    ParagraphStyle(
        name="Body",
        fontName="Times-Roman",
        fontSize=9.6,
        leading=11.9,
    )
)
styles.add(
    ParagraphStyle(
        name="BodyItalic",
        fontName="Times-Italic",
        fontSize=9.6,
        leading=11.8,
        textColor=colors.HexColor("#222222"),
    )
)
styles.add(
    ParagraphStyle(
        name="Small",
        fontName="Times-Roman",
        fontSize=8.9,
        leading=10.3,
    )
)
styles.add(
    ParagraphStyle(
        name="PubTitle",
        fontName="Times-Bold",
        fontSize=9.8,
        leading=11.6,
    )
)
styles.add(
    ParagraphStyle(
        name="PubMeta",
        fontName="Times-Roman",
        fontSize=9.35,
        leading=11.2,
    )
)
styles.add(
    ParagraphStyle(
        name="PubVenue",
        fontName="Times-Italic",
        fontSize=9.35,
        leading=11.2,
        textColor=colors.HexColor("#111111"),
    )
)
styles.add(
    ParagraphStyle(
        name="CVBullet",
        fontName="Times-Roman",
        fontSize=9.1,
        leading=10.4,
        leftIndent=0,
        firstLineIndent=0,
    )
)

story = []


def rule():
    t = Table([[""]], colWidths=[doc.width], rowHeights=[1])
    t.setStyle(TableStyle([("LINEABOVE", (0, 0), (-1, -1), 0.55, colors.black)]))
    return t


def section(title):
    story.append(Spacer(1, 3))
    story.append(Paragraph(title.upper(), styles["Section"]))
    story.append(rule())
    story.append(Spacer(1, 5))
    story.append(Indenter(CONTENT_INDENT, 0))


def end_section():
    story.append(Indenter(-CONTENT_INDENT, 0))


def entry(title, date, subtitle, detail=""):
    date = date.replace(" - ", "&nbsp;-&nbsp;")
    subtitle_line = subtitle if not detail else f"{subtitle}. {detail}"
    data = [
        [
            Paragraph(f"<b>{title}</b>", styles["Body"]),
            Paragraph(f"<i>{date}</i>", styles["BodyItalic"]),
        ],
        [
            Paragraph(f"<i>{subtitle_line}</i>", styles["BodyItalic"]),
            Paragraph("", styles["BodyItalic"]),
        ],
    ]
    t = Table(
        data,
        colWidths=[doc.width - CONTENT_INDENT - DATE_COL_WIDTH - 0.14 * inch, DATE_COL_WIDTH],
    )
    t.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    story.append(t)
    story.append(Spacer(1, 5))


def bullet(text):
    story.append(Paragraph(text, styles["CVBullet"]))


def project(title, year, detail):
    story.append(Paragraph(f"<b>{title}</b> <i>({year})</i>", styles["Body"]))
    story.append(Paragraph(f"<i>{detail}</i>", styles["BodyItalic"]))
    story.append(Spacer(1, 5))


story.append(Paragraph("SIPU ZHU", styles["Name"]))
story.append(
    Paragraph(
        "Beijing, China &nbsp;&nbsp;•&nbsp;&nbsp; zhusp22@mails.tsinghua.edu.cn",
        styles["Contact"],
    )
)
story.append(Spacer(1, 4))

section("Profile")
story.append(
    Paragraph(
        "I am an incoming Ph.D. student in Architecture at Tsinghua University. I study the intersection of architectural design, spatial intelligence, human-computer interaction, and AI in the built environment, with a particular interest in interdisciplinary research across design, technology, and the humanities.",
        styles["Body"],
    )
)
end_section()

section("Education")
entry(
    "Tsinghua University, Beijing, China",
    "Sep 2026 - Expected",
    "Incoming PhD in Architectural Design, Architecture",
    "Advised by Academician Zhuang Weimin",
)
entry(
    "Tsinghua University, Beijing, China",
    "Sep 2022 - Present",
    "Bachelor of Architecture",
    "GPA: 3.89/4.0, ranked 2nd",
)
end_section()

section("Publications")
story.append(
    Paragraph(
        "Healing with sight, smell and sound: A virtual reality study on multisensory synergistic stress recovery in hospital staff break spaces",
        styles["PubTitle"],
    )
)
story.append(
    Paragraph(
        "Dalin Lyu, Hengyi Cong, <b>Sipu Zhu</b>, Yulong Liu, Weimin Zhuang",
        styles["PubMeta"],
    )
)
story.append(
    Paragraph(
        "<b>Keywords:</b> virtual reality, multisensory design, healthcare architecture, stress recovery",
        styles["PubMeta"],
    )
)
story.append(
    Paragraph(
        '<i>Building and Environment 2026, 114587</i> <a href="https://doi.org/10.1016/j.buildenv.2026.114587" color="black">[link]</a>',
        styles["PubVenue"],
    )
)
end_section()

section("Selected Projects")
project(
    "Human-Robot Interaction in Architectural Space",
    "2026",
    "Spatial scale, visual attention, and perception toward robots in architectural environments; under review, in collaboration with Tsinghua University Robot Control Laboratory and AgiBot.",
)
project(
    "Evaluation of Aesthetic Perception in Large Language Models",
    "2025",
    "Comparative study of large language model judgments and human aesthetic responses; rated A+ in the Tsinghua University Student Research Training Program.",
)
project(
    "Immersive Architectural Interaction Design with CAVE Projection",
    "2024",
    "Immersive architectural design workflows using CAVE projection, VR simulation, and real-time digital environments; rated A+ in the Tsinghua University Student Research Training Program.",
)
end_section()

section("Honors and Awards")
for line in [
    "Toyota Scholarship, Tsinghua Alumni Comprehensive Excellence Scholarship (2025)",
    "Cheng Xiankang Memorial Scholarship, Tsinghua Alumni Comprehensive Excellence Scholarship (2024)",
    "Guangyi Design First-Class Scholarship, Tsinghua University (2024)",
    "Toyota Scholarship, Tsinghua Alumni Comprehensive Excellence Scholarship (2023)",
    "Outstanding Social Work Scholarship, Tsinghua University (2023)",
]:
    bullet(line)
end_section()

section("Research Interests")
story.append(
    Paragraph(
        "Architectural Design; Built Environment; Human-Computer Interaction; AI in Architecture; Spatial Intelligence; Urban Studies",
        styles["Body"],
    )
)
end_section()

section("Employment")
entry(
    "Tsinghua Architectural Design and Research Institute, Beijing, China",
    "Feb 2026 - Present",
    "Intern",
)
entry(
    "Vanke Southwest Architectural Design Research Center, China",
    "Jun 2024 - Sep 2024",
    "Intern",
)
end_section()

doc.build(story)
print(OUT)
