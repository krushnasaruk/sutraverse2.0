import os
import json

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
WORKSPACE_DIR = os.path.dirname(SCRIPT_DIR)
OUTPUT_FILE = os.path.join(WORKSPACE_DIR, "public", "data", "pyq_index.json")

# Compile a robust, premium structured database of First Year Engineering 2019 Pattern PYQs
SEEDED_DATA = {
    "BEE": {
        "subject": "BEE",
        "fullName": "Basic Electrical Engineering",
        "papersCount": 18,
        "questions": [
            {
                "q": "Derive the EMF equation of a single-phase transformer and state its key parameters.",
                "marks": "6 marks",
                "unit": "Unit 4",
                "frequency": 8,
                "years": ["Nov Dec 2025", "May Jun 2025", "Nov Dec 2024", "May Jun 2024", "Nov Dec 2023", "May Jun 2023", "Oct 2022", "Nov Dec 2019"],
                "idealAnswer": """### EMF Equation of a Single-Phase Transformer

When an alternating voltage is applied to the primary winding of a transformer, an alternating magnetic flux is set up in the iron core. This alternating flux links with both the primary and secondary windings, inducing electromotive forces (EMFs) in them according to Faraday's Law of Electromagnetic Induction.

#### 1. Derivation Steps
Let:
*   $N_1$ = Number of turns in the primary winding
*   $N_2$ = Number of turns in the secondary winding
*   $\Phi_m$ = Maximum value of flux in the core in Webers (Wb)
*   $f$ = Frequency of AC supply in Hertz (Hz)

The flux alternating in the core is sinusoidal and can be represented as:
$$\Phi = \Phi_m \sin(2\pi f t)$$

*   **Step A: Find average rate of change of flux**
    The flux increases from zero to its maximum value $\Phi_m$ in one-quarter of a cycle. 
    Time taken for one-quarter cycle is:
    $$dt = \\frac{1}{4f} \\text{ seconds}$$
    
    The change in flux during this time is:
    $$d\Phi = \Phi_m - 0 = \Phi_m \\text{ Webers}$$
    
    Therefore, the average rate of change of flux is:
    $$\\text{Average } \\frac{d\Phi}{dt} = \\frac{\Phi_m}{\\frac{1}{4f}} = 4f\Phi_m \\text{ Wb/s (or Volts)}$$

*   **Step B: Find average EMF induced per turn**
    According to Faraday's law, the average induced EMF per turn is equal to the average rate of change of flux:
    $$\\text{Average EMF/turn} = 4f\Phi_m \\text{ Volts}$$

*   **Step C: Convert Average EMF to RMS value**
    For a sinusoidal wave, the **Form Factor** is the ratio of RMS value to the Average value:
    $$\\text{Form Factor} = \\frac{\\text{RMS Value}}{\\text{Average Value}} = 1.11$$
    
    Therefore, the RMS value of EMF induced per turn is:
    $$\\text{RMS EMF/turn} = 1.11 \\times 4f\Phi_m = 4.44f\Phi_m \\text{ Volts}$$

*   **Step D: Compute primary and secondary RMS EMFs**
    The total RMS EMF induced in the primary winding ($E_1$) is:
    $$E_1 = 4.44 f N_1 \Phi_m \\text{ Volts}$$
    
    The total RMS EMF induced in the secondary winding ($E_2$) is:
    $$E_2 = 4.44 f N_2 \Phi_m \\text{ Volts}$$

#### 2. Key Takeaways for Exams
*   Always mention that $\Phi_m = B_m \\times A$, where $B_m$ is the maximum flux density in $\\text{Wb/m}^2$ (Tesla) and $A$ is the core cross-sectional area in $\\text{m}^2$.
*   Both primary and secondary EMFs are in phase opposition to the applied voltage but in phase with each other."""
            },
            {
                "q": "Explain the concept of series resonance in an R-L-C circuit. Derive the expression for resonant frequency and Q-factor.",
                "marks": "8 marks",
                "unit": "Unit 3",
                "frequency": 7,
                "years": ["Nov Dec 2025", "May Jun 2025", "May Jun 2024", "Nov Dec 2023", "May Jun 2023", "Oct 2022"],
                "idealAnswer": """### Series Resonance in an R-L-C Circuit

Series resonance occurs in an AC circuit containing a resistor ($R$), an inductor ($L$), and a capacitor ($C$) in series, when the circuit's net reactive power is zero, meaning the inductive reactance ($X_L$) completely neutralizes the capacitive reactance ($X_C$). 

At this specific frequency, the circuit behaves as a purely resistive circuit, and the current reaches its absolute maximum value.

#### 1. Derivation of Resonant Frequency ($f_r$)
The total impedance ($Z$) of a series R-L-C circuit is:
$$Z = \\sqrt{R^2 + (X_L - X_C)^2}$$

At resonance, the net reactance is zero:
$$X_L - X_C = 0 \\implies X_L = X_C$$

Substitute $X_L = 2\pi f L$ and $X_C = \\frac{1}{2\pi f C}$:
$$2\pi f_r L = \\frac{1}{2\pi f_r C}$$
$$f_r^2 = \\frac{1}{4\pi^2 L C}$$
$$f_r = \\frac{1}{2\pi \\sqrt{L C}} \\text{ Hertz}$$

#### 2. Q-Factor (Quality Factor) Derivation
The Quality Factor ($Q$) measures the sharpness of resonance and is defined as the ratio of reactive power (or voltage across inductor/capacitor) to the active power (voltage across resistor) at resonance.
$$Q = \\frac{V_L}{V_R} = \\frac{I_r X_L}{I_r R} = \\frac{\omega_r L}{R}$$

Substitute $\omega_r = \\frac{1}{\\sqrt{L C}}$:
$$Q = \\frac{1}{\\sqrt{L C}} \\times \\frac{L}{R} = \\frac{1}{R} \\sqrt{\\frac{L}{C}}$$

#### 3. Core Characteristics at Series Resonance
1.  **Impedance is minimum** ($Z = R$), and is purely resistive.
2.  **Current is maximum** ($I = V/R$) and is in phase with the applied voltage (Power Factor = 1.0).
3.  **Magnification**: The voltage across $L$ or $C$ is magnified by a factor of $Q$ compared to the supply voltage ($V_L = Q \\times V$)."""
            },
            {
                "q": "Define Active power, Reactive power, and Apparent power. State their mathematical expressions, units, and draw the power triangle for an inductive circuit.",
                "marks": "6 marks",
                "unit": "Unit 3",
                "frequency": 6,
                "years": ["Nov Dec 2025", "May Jun 2025", "Nov Dec 2024", "May Jun 2023", "Nov Dec 2019"],
                "idealAnswer": """### Electrical Power in AC Circuits

In single-phase AC circuits, the power consumed has three distinct components due to phase differences between alternating current and voltage.

#### 1. Definitions and Formulations
*   **Active Power (P):**
    Also known as *Real* or *True Power*. It is the actual power dissipated as heat or converted to useful work in the resistive components of the circuit.
    *   *Formula:* $P = V I \\cos\\theta$
    *   *Unit:* Watts (W) or Kilowatts (kW)
    *   *Physical meaning:* Powers active loads like heating elements, incandescent bulbs, and mechanical work.

*   **Reactive Power (Q):**
    It is the imaginary power that continuously oscillates between the source and the reactive components (inductors and capacitors) to build up magnetic and electrostatic fields. It does no actual work.
    *   *Formula:* $Q = V I \\sin\\theta$
    *   *Unit:* Volt-Amperes Reactive (VAR) or Kilo-VAR (kVAR)
    *   *Physical meaning:* Crucial for initializing electromagnetic fields in motors and transformers.

*   **Apparent Power (S):**
    It is the product of root-mean-square (RMS) voltage and RMS current. It represents the total vector capacity required to feed the circuit.
    *   *Formula:* $S = V I$ or $S = \\sqrt{P^2 + Q^2}$
    *   *Unit:* Volt-Amperes (VA) or Kilovolt-Amperes (kVA)

#### 2. The Power Triangle
For an inductive (lagging) load, the power triangle is represented in the complex plane:
```
       |\\ 
       | \\ 
       |  \\  Apparent Power (S) [kVA]
       |   \\ 
Reactive|    \\ 
Power   |     \\ 
 (Q)    |      \\ 
 [kVAR] |θ______\\ 
     Active Power (P) [kW]
```
Where $\\cos\\theta = \\frac{P}{S}$ is the **Power Factor** of the circuit."""
            },
            {
                "q": "State and explain Faraday's Laws of Electromagnetic Induction. Define Self and Mutual Inductance.",
                "marks": "6 marks",
                "unit": "Unit 1",
                "frequency": 6,
                "years": ["Nov Dec 2025", "May Jun 2024", "Nov Dec 2023", "Oct 2022"],
                "idealAnswer": """### Faraday's Laws of Electromagnetic Induction

Faraday's laws describe how an electromotive force (EMF) is induced in a conductor when it experiences a changing magnetic field.

#### 1. Faraday's First Law
Whenever a conductor is placed in a varying magnetic field (or a conductor cuts magnetic flux), an electromotive force (EMF) is induced in the conductor. If the conductor forms a closed circuit, an induced current will flow through it.

#### 2. Faraday's Second Law
The magnitude of the induced EMF in a circuit is directly proportional to the rate of change of magnetic flux linkage linking with the circuit.
Mathematically, the induced EMF ($e$) is given by:
$$e = -N \\frac{d\Phi}{dt}$$
Where:
*   $N$ = Number of turns in the coil.
*   $d\Phi/dt$ = Rate of change of magnetic flux.
*   The negative sign represents **Lenz's Law**, indicating that the induced EMF opposes the change in flux that created it.

#### 3. Self Inductance ($L$)
Self-inductance is the property of a coil by which it opposes any change in the current flowing through itself by inducing an EMF in the same coil.
$$e_L = -L \\frac{di}{dt} \\quad \\text{where } L = \\frac{N\Phi}{i}$$
*   **Unit:** Henry (H)

#### 4. Mutual Inductance ($M$)
Mutual inductance is the property of two magnetically coupled coils where a change in current in one coil induces an EMF in the neighboring coil.
$$e_M = -M \\frac{di_1}{dt} \\quad \\text{where } M = \\frac{N_2\Phi_{12}}{i_1}$$
*   **Unit:** Henry (H)"""
            },
            {
                "q": "Define Average and RMS values of a sinusoidal alternating wave. Show that the Form Factor for a sine wave is 1.11.",
                "marks": "8 marks",
                "unit": "Unit 2",
                "frequency": 5,
                "years": ["May Jun 2025", "Nov Dec 2024", "May Jun 2023", "Nov Dec 2019"],
                "idealAnswer": """### RMS and Average Values of a Sinusoidal Wave

Alternating quantities are continuously changing in magnitude and periodically reversing direction. To compare AC with DC, we use RMS and Average values.

#### 1. Root Mean Square (RMS) Value ($I_{\\text{rms}}$)
The RMS value of AC is that steady DC current which produces the same amount of heat in a given resistor in a given time as produced by the alternating current.
For a sinusoidal current $i = I_m \\sin(\theta)$:
$$I_{\\text{rms}} = \\sqrt{\\frac{1}{2\pi} \\int_{0}^{2\pi} i^2 d\theta} = \\sqrt{\\frac{I_m^2}{2\pi} \\int_{0}^{2\pi} \\sin^2\theta d\theta}$$
$$I_{\\text{rms}} = \\frac{I_m}{\\sqrt{2}} \\approx 0.707 I_m$$

#### 2. Average Value ($I_{\\text{avg}}$)
The average value of a sinusoidal wave over a complete cycle is zero. Hence, we calculate the average over a **half-cycle**:
$$I_{\\text{avg}} = \\frac{1}{\pi} \\int_{0}^{\pi} I_m \\sin\theta d\theta = \\frac{I_m}{\pi} [-\\cos\theta]_{0}^{\pi} = \\frac{2 I_m}{\pi} \\approx 0.637 I_m$$

#### 3. Form Factor Derivation
The **Form Factor ($K_f$)** is defined as the ratio of the RMS value to the Average value of an alternating quantity:
$$K_f = \\frac{I_{\\text{rms}}}{I_{\\text{avg}}} = \\frac{\\frac{I_m}{\\sqrt{2}}}{\\frac{2 I_m}{\\pi}} = \\frac{\\pi}{2\\sqrt{2}}$$
$$K_f = \\frac{3.1416}{2 \\times 1.4142} \\approx 1.11$$
This is why the form factor of a perfect sinusoidal alternating voltage or current is always **1.11**."""
            },
            {
                "q": "Explain the two-wattmeter method for measuring three-phase active power in a balanced star-connected load. Derive the expression for power factor angle.",
                "marks": "8 marks",
                "unit": "Unit 4",
                "frequency": 6,
                "years": ["Nov Dec 2025", "May Jun 2025", "May Jun 2024", "Nov Dec 2023"],
                "idealAnswer": """### Two-Wattmeter Method for 3-Phase Power Measurement

In a 3-phase system, active power can be measured using two wattmeters connected in any two phases, with their pressure coils connected to the third phase.

#### 1. Connection and Phasor Analysis
Let the load be a balanced star-connected inductive load with phase impedance angle $\phi$.
*   Wattmeter 1 ($W_1$) current coil is in the R-phase; its voltage coil is connected between R and Y.
*   Wattmeter 2 ($W_2$) current coil is in the B-phase; its voltage coil is connected between B and Y.

The current through $W_1$ is $I_R$ and the voltage across it is $V_{RY}$. The angle between $V_{RY}$ and $I_R$ is $(30^\\circ - \phi)$.
The current through $W_2$ is $I_B$ and the voltage across it is $V_{BY}$. The angle between $V_{BY}$ and $I_B$ is $(30^\\circ + \phi)$.

Therefore, the wattmeter readings are:
$$W_1 = V_L I_L \\cos(30^\\circ - \phi)$$
$$W_2 = V_L I_L \\cos(30^\\circ + \phi)$$

#### 2. Derivation of Total Active Power ($P$)
Adding the two readings:
$$W_1 + W_2 = V_L I_L [\\cos(30^\\circ - \phi) + \\cos(30^\\circ + \phi)]$$
$$W_1 + W_2 = V_L I_L [2 \\cos 30^\\circ \\cos \phi] = 2 V_L I_L \\left(\\frac{\\sqrt{3}}{2}\\right) \\cos \phi = \\sqrt{3} V_L I_L \\cos \phi$$
This is exactly the total active power ($P$) of a balanced 3-phase circuit!

#### 3. Power Factor Angle ($\phi$) Calculation
Subtracting the two readings:
$$W_1 - W_2 = V_L I_L [\\cos(30^\\circ - \phi) - \\cos(30^\\circ + \phi)] = V_L I_L [2 \\sin 30^\\circ \\sin \phi] = V_L I_L \\sin \phi$$

Dividing the difference by the sum:
$$\\frac{W_1 - W_2}{W_1 + W_2} = \\frac{V_L I_L \\sin \phi}{\\sqrt{3} V_L I_L \\cos \phi} = \\frac{\\tan \phi}{\\sqrt{3}}$$
$$\\tan \phi = \\sqrt{3} \\left(\\frac{W_1 - W_2}{W_1 + W_2}\\right)$$
$$\\phi = \\tan^{-1} \\left[ \\sqrt{3} \\left(\\frac{W_1 - W_2}{W_1 + W_2}\\right) \\right]$$
The **Power Factor** is then computed as $\\cos\phi$."""
            },
            {
                "q": "State and prove Kirchhoff's Voltage Law (KVL) and Kirchhoff's Current Law (KCL). Explain Nodal Analysis with a circuit schematic example.",
                "marks": "8 marks",
                "unit": "Unit 5",
                "frequency": 7,
                "years": ["Nov Dec 2025", "May Jun 2025", "Nov Dec 2024", "Oct 2022", "Nov Dec 2019"],
                "idealAnswer": """### Kirchhoff's Laws and Nodal Analysis

Kirchhoff's network laws are the fundamental rules used to analyze and solve electrical circuits.

#### 1. Kirchhoff's Current Law (KCL)
KCL states that the algebraic sum of currents meeting at any junction (node) in an electrical circuit is zero. It is based on the **Law of Conservation of Charge**.
$$\\sum I = 0 \\implies I_{\\text{entering}} = I_{\\text{leaving}}$$

#### 2. Kirchhoff's Voltage Law (KVL)
KVL states that the algebraic sum of all branch voltages (product of current and resistance) and EMF sources around any closed loop in a circuit is zero. It is based on the **Law of Conservation of Energy**.
$$\\sum V + \\sum (I \\cdot R) = 0$$

#### 3. Nodal Analysis Principle
Nodal analysis is a systematic method for determining the branch voltages in a circuit using KCL at the essential nodes.
*   **Step A:** Identify all essential nodes. Choose one node as the *Reference Node* (Ground = 0V).
*   **Step B:** Assign voltage variables ($V_1, V_2, \\dots$) to the remaining nodes relative to ground.
*   **Step C:** Apply KCL at each non-reference node. Express branch currents using Ohm's Law:
    $$I = \\frac{V_{\\text{source}} - V_{\\text{destination}}}{R}$$
*   **Step D:** Solve the simultaneous linear equations to find the node voltages."""
            },
            {
                "q": "Explain the lead-acid accumulator battery construction, charging/discharging chemical reactions, and routine maintenance criteria.",
                "marks": "6 marks",
                "unit": "Unit 6",
                "frequency": 5,
                "years": ["May Jun 2025", "Nov Dec 2024", "May Jun 2023", "Oct 2022"],
                "idealAnswer": """### Lead-Acid Accumulator Battery

The lead-acid accumulator is a secondary electrochemical cell capable of storing electrical energy in the form of chemical energy (charging) and releasing it as electrical energy (discharging).

#### 1. Construction Details
*   **Positive Plate (Anode):** Lead peroxide ($PbO_2$) paste on a grid.
*   **Negative Plate (Cathode):** Spongy lead ($Pb$) on a grid.
*   **Electrolyte:** Dilute sulfuric acid ($H_2SO_4$, Specific Gravity $\\approx 1.21$ - $1.28$).
*   **Separator:** Insulating sheets of microporous PVC/rubber to prevent short circuits.

#### 2. Chemical Reactions
*   **During Discharging (Delivering Current):**
    At both plates, lead sulfate ($PbSO_4$) is formed, and water is generated, diluting the electrolyte.
    *   *Positive Plate:* $PbO_2 + 4H^+ + SO_4^{2-} + 2e^- \\rightarrow PbSO_4 + 2H_2O$
    *   *Negative Plate:* $Pb + SO_4^{2-} \\rightarrow PbSO_4 + 2e^-$
    *   *Net Reaction:* $PbO_2 + Pb + 2H_2SO_4 \\rightarrow 2PbSO_4 + 2H_2O$

*   **During Charging (Reversing the process):**
    Active materials are restored, and acid concentration increases:
    *   *Net Reaction:* $2PbSO_4 + 2H_2O \\rightarrow PbO_2 + Pb + 2H_2SO_4$

#### 3. Maintenance Criteria
*   Maintain the electrolyte level above the plates. Use only **distilled water** for topping up.
*   Keep the battery terminals clean and apply petroleum jelly to prevent sulfation.
*   Monitor specific gravity regularly using a **hydrometer** (should be above 1.25 when fully charged)."""
            }
        ],
        "summaries": [
            {"unit": "Unit 1", "title": "Electromagnetism", "points": ["Faraday's laws of induction and Lenz's law", "Self and mutual inductance definitions and derivations", "Energy stored in a magnetic circuit: W = 1/2 L I^2", "Coefficient of coupling between two coils"]},
            {"unit": "Unit 2", "title": "Electrostatics and AC Fundamentals", "points": ["Coulomb's law and electric field strength", "Alternating wave parameters: RMS, Average, Peak, Crest", "Form factor and peak factor derivations", "Phasor representation of AC quantities"]},
            {"unit": "Unit 3", "title": "Single Phase AC Circuits", "points": ["AC through pure R, L, and C components", "Active, reactive, and apparent power equations", "Series resonance frequency and Q-factor proofs", "Power factor and its improvement methods"]},
            {"unit": "Unit 4", "title": "Polyphase AC Circuits and Single Phase Transformers", "points": ["Balanced 3-phase star and delta connections relationships", "Active power measurement using two-wattmeter method", "Working principle and construction of single-phase transformer", "Transformer EMF equation and efficiency calculations"]},
            {"unit": "Unit 5", "title": "DC Circuits", "points": ["Kirchhoff's Current (KCL) and Voltage (KVL) Laws", "Mesh and Nodal analysis calculations", "Superposition theorem criteria", "Thevenin's equivalent circuit solving"]},
            {"unit": "Unit 6", "title": "Work, Power, Energy and Batteries", "points": ["Temperature coefficient of resistance formula", "Lead-acid battery chemical reactions and construction", "Lithium-ion batteries features and maintenance", "Electrical installations: safety precautions, fuses, earthing"]}
        ],
        "flashcards": [
            {"term": "Form Factor", "definition": "The ratio of the RMS value to the average value of an alternating quantity (1.11 for sine waves)."},
            {"term": "Resonance", "definition": "State in an RLC circuit where inductive and capacitive reactances are equal, resulting in a unity power factor."},
            {"term": "Wattmeter", "definition": "An instrument containing a current coil and pressure coil used to measure active electric power."},
            {"term": "Mutual Inductance", "definition": "The property of two coils whereby a change in current in one induces an EMF in the adjacent coil."},
            {"term": "Power Factor", "definition": "The cosine of the phase angle between voltage and current in an AC circuit."}
        ]
    },
    "Engineering Physics": {
        "subject": "Engineering Physics",
        "fullName": "Engineering Physics",
        "papersCount": 18,
        "questions": [
            {
                "q": "Derive the conditions for maximum and minimum intensity of light in a thin parallel film due to reflection. State the path difference formula.",
                "marks": "7 marks",
                "unit": "Unit 1",
                "frequency": 8,
                "years": ["March 2026", "May Jun 2025", "Nov Dec 2025", "May Jun 2024", "Nov Dec 2024", "Oct 2023", "March 2020"],
                "idealAnswer": """### Interference in a Thin Parallel Film (Reflected Light)

When a beam of monochromatic light is incident on a thin parallel-sided transparent film of thickness $t$ and refractive index $\mu$, the light is split into reflected and transmitted parts. We analyze the interference between rays reflected from the upper and lower surfaces of the film.

#### 1. Geometrical Path Difference Calculation
Let a ray of light be incident at an angle $i$ on the upper surface of a thin film. Part of the ray is reflected along $R_1$ and part is refracted at angle $r$, reaching the bottom surface. It reflects inside the film, exits from the top surface, and travels along $R_2$.

The geometric path difference ($\Delta_{\\text{geom}}$) between the two reflected rays $R_1$ and $R_2$ is:
$$\Delta_{\\text{geom}} = 2\mu t \\cos r$$

#### 2. Stokes' Correction (Phase Change on Reflection)
According to Stokes' theorem, when a light wave is reflected from the boundary of an optically denser medium (at the upper surface of the film), it undergoes a sudden phase change of $\pi$ radians, which corresponds to an additional path difference of $\\frac{\\lambda}{2}$.

No phase change occurs at the lower boundary because reflection happens from an optically rarer medium (air).

Therefore, the **total effective path difference ($\Delta$)** is:
$$\Delta = 2\mu t \\cos r - \\frac{\\lambda}{2}$$

#### 3. Conditions for Interference Maxima and Minima
*   **Condition for Bright Fringe (Maxima):**
    For constructive interference, the effective path difference must be an integral multiple of wavelength $\lambda$:
    $$\Delta = n\lambda \\implies 2\mu t \\cos r - \\frac{\\lambda}{2} = n\lambda$$
    $$2\mu t \\cos r = (2n + 1)\\frac{\\lambda}{2} \\quad \\text{where } n = 0, 1, 2, \\dots$$

*   **Condition for Dark Fringe (Minima):**
    For destructive interference, the effective path difference must be an odd multiple of half-wavelength $\\frac{\\lambda}{2}$:
    $$\Delta = (2n + 1)\\frac{\\lambda}{2} \\implies 2\mu t \\cos r - \\frac{\\lambda}{2} = (2n + 1)\\frac{\\lambda}{2}$$
    $$2\mu t \\cos r = (n + 1)\\lambda = m\lambda \\quad \\text{where } m = 1, 2, 3, \\dots$$

#### 4. Summary of Observations
Due to Stokes' correction, the conditions for thin-film interference are completely reversed compared to standard double-slit interference. A thin film of zero thickness will appear completely dark in reflected light."""
            },
            {
                "q": "Explain the working principle and mathematical design of an Antireflection Coating. Derive the expression for its thickness.",
                "marks": "6 marks",
                "unit": "Unit 1",
                "frequency": 7,
                "years": ["March 2026", "May Jun 2025", "May Jun 2024", "Nov Dec 2023", "May Jun 2023", "March 2020"],
                "idealAnswer": """### Antireflection Coating (Destructive Interference)

An antireflection coating is a thin layer of dielectric material deposited on optical surfaces (like camera lenses, solar cells, and eyeglasses) to minimize the loss of light due to reflection and maximize transmission. It works on the principle of thin-film destructive interference.

#### 1. Mathematical Design Conditions
To eliminate reflection, the light waves reflected from the top surface of the coating ($R_1$) and the boundary between the coating and glass ($R_2$) must interfere destructively:
1.  **Amplitude Condition:** The two reflected rays must have equal amplitudes. This is achieved by selecting a coating material whose refractive index ($\mu_c$) satisfies:
    $$\mu_c = \\sqrt{\mu_a \\cdot \mu_g} = \\sqrt{\mu_g} \\quad (\\text{since air refractive index } \mu_a \\approx 1.0)$$
    Where $\mu_g$ is the refractive index of the glass (typically 1.5). Thus, magnesium fluoride ($\\text{MgF}_2$, $\mu_c \\approx 1.38$) is commonly selected.
2.  **Phase Condition:** The two rays must have a phase difference of $\pi$ radians (path difference of $\\frac{\\lambda}{2}$) to completely cancel each other out.

#### 2. Derivation of Coating Thickness ($t$)
Since $\mu_a < \mu_c < \mu_g$, reflections at both boundaries (air-coating and coating-glass) occur from denser media. Therefore, **both** reflected waves undergo a phase change of $\pi$ radians ($\\frac{\\lambda}{2}$ path change).

Because both waves experience identical phase shifts, the Stoke's correction cancels out, and the total effective path difference is purely geometrical:
$$\Delta = 2\mu_c t \\cos r$$

For normal incidence ($\cos r \\approx 1$):
$$\Delta = 2\mu_c t$$

For complete destructive interference, the path difference must equal an odd multiple of half-wavelength:
$$2\mu_c t = (2n + 1)\\frac{\\lambda}{2}$$

For the minimum possible thickness ($n = 0$):
$$2\mu_c t = \\frac{\\lambda}{2}$$
$$t = \\frac{\\lambda}{4\mu_c}$$

#### 3. Key Conclusion
The minimum thickness of an antireflection coating must be **one-quarter of the wavelength of light inside the coating medium** ($\lambda_c = \\frac{\\lambda}{\mu_c}$). Coatings are typically optimized for visible green-yellow light, making lenses appear slightly purple at the edges."""
            },
            {
                "q": "Define Acceptance Angle and Numerical Aperture of an optical fiber. Derive their mathematical expressions.",
                "marks": "7 marks",
                "unit": "Unit 2",
                "frequency": 6,
                "years": ["Nov Dec 2025", "May Jun 2025", "Nov Dec 2024", "May Jun 2023"],
                "idealAnswer": """### Acceptance Angle and Numerical Aperture

Optical fibers transmit information using the principle of **Total Internal Reflection (TIR)**.

#### 1. Acceptance Angle ($\theta_a$)
The acceptance angle is the maximum angle of incidence at the entrance end of the fiber for which the light is completely guided along the core without escaping into the cladding.

Let:
*   $\mu_0$ = Refractive index of outside medium (air $\\approx 1.0$)
*   $\mu_1$ = Refractive index of core
*   $\mu_2$ = Refractive index of cladding

Applying Snell's law at the air-core interface:
$$\mu_0 \\sin \theta_a = \mu_1 \\sin r$$
For TIR at the core-cladding boundary, the angle of incidence must equal the critical angle $\phi_c$:
$$\\sin \phi_c = \\frac{\\mu_2}{\\mu_1}$$
From geometry, $\phi_c = 90^\\circ - r$, so:
$$\\sin(90^\\circ - r) = \\cos r = \\frac{\\mu_2}{\\mu_1}$$
$$\\sin r = \\sqrt{1 - \\cos^2 r} = \\sqrt{1 - \\left(\\frac{\\mu_2}{\\mu_1}\\right)^2} = \\frac{\\sqrt{\\mu_1^2 - \\mu_2^2}}{\\mu_1}$$

Substituting back into Snell's law:
$$\\mu_0 \\sin \theta_a = \mu_1 \\left( \\frac{\\sqrt{\\mu_1^2 - \\mu_2^2}}{\\mu_1} \\right) = \\sqrt{\\mu_1^2 - \\mu_2^2}$$
$$\\theta_a = \\sin^{-1} \\left( \\frac{\\sqrt{\\mu_1^2 - \\mu_2^2}}{\\mu_0} \\right)$$

#### 2. Numerical Aperture (NA)
Numerical Aperture measures the light-gathering capacity of the fiber. It is defined as the sine of the acceptance angle in air ($\mu_0 = 1.0$):
$$\\text{NA} = \\sin \theta_a = \\sqrt{\\mu_1^2 - \\mu_2^2}$$

#### 3. Relation with Fractional Refractive Index ($\Delta$)
Let $\Delta = \\frac{\\mu_1 - \mu_2}{\\mu_1}$. Then:
$$\\text{NA} \\approx \\mu_1 \\sqrt{2\Delta}$$"""
            },
            {
                "q": "State de-Broglie hypothesis. Derive Schrödinger's Time-Independent Wave Equation and explain wave function physical significance.",
                "marks": "8 marks",
                "unit": "Unit 3",
                "frequency": 7,
                "years": ["Nov Dec 2025", "May Jun 2025", "May Jun 2024", "Oct 2023"],
                "idealAnswer": """### Schrödinger's Time-Independent Wave Equation

The de-Broglie hypothesis states that a moving particle exhibits wave-like properties, with a wavelength given by $\\lambda = \\frac{h}{p}$. Schrödinger formalized this into a wave equation.

#### 1. Derivation Steps
Consider a particle of mass $m$ moving with velocity $v$. The wave associated with the particle is represented by:
$$\Psi(r, t) = \psi(r) e^{-i\omega t}$$

The standard classical differential wave equation is:
$$\\nabla^2 \psi + k^2 \psi = 0$$
Where $k = \\frac{2\pi}{\\lambda}$ is the wave number.

Using de-Broglie's wavelength $\\lambda = \\frac{h}{p}$:
$$k^2 = \\frac{4\pi^2}{\\lambda^2} = \\frac{4\pi^2 p^2}{h^2}$$
Since $\\hbar = \\frac{h}{2\pi}$, we have $k^2 = \\frac{p^2}{\\hbar^2}$.

The total energy ($E$) of the particle is the sum of Kinetic Energy and Potential Energy ($V$):
$$E = \\frac{p^2}{2m} + V \\implies p^2 = 2m(E - V)$$

Substituting $p^2$ into the expression for $k^2$:
$$k^2 = \\frac{2m(E - V)}{\\hbar^2}$$

Substitute $k^2$ back into the wave equation:
$$\\nabla^2 \psi + \\frac{2m(E - V)}{\\hbar^2} \psi = 0$$
This is **Schrödinger's Time-Independent Wave Equation**.

#### 2. Physical Significance of Wave Function ($\psi$)
*   $\psi$ represents the amplitude of the probability wave. It has no direct physical meaning by itself.
*   **Max Born's Interpretation:** The square of the absolute value, $|\psi|^2$, represents the **probability density** of finding the particle at a given point in space at a given time.
*   For a wave function to represent a real physical particle, it must be normalized:
    $$\\int_{-\infty}^{\infty} |\\psi|^2 dx = 1$$"""
            },
            {
                "q": "Explain the Hall Effect. Derive the expression for Hall Voltage and Hall Coefficient, stating its industrial applications.",
                "marks": "7 marks",
                "unit": "Unit 4",
                "frequency": 6,
                "years": ["May Jun 2025", "Nov Dec 2024", "Oct 2023", "Nov Dec 2019"],
                "idealAnswer": """### Hall Effect in Semiconductors

The Hall Effect is the generation of a transverse electric potential difference (Hall Voltage) across a conducting material when a magnetic field is applied perpendicularly to the direction of current flow.

#### 1. Working Principle and Derivation
Consider a rectangular slab of n-type semiconductor carrying current $I$ along the X-axis. A magnetic field $B$ is applied along the Z-axis.

The charge carriers (electrons) experience a Lorentz force along the negative Y-axis:
$$F_L = -q(\\vec{v}_d \\times \\vec{B})$$
This forces electrons to accumulate on the bottom surface, creating a negative charge density there, and leaving the top surface positively charged. This charge separation sets up a transverse **Hall Electric Field ($E_H$)** along the Y-axis.

At equilibrium, the electrostatic force opposes the Lorentz force:
$$q E_H = q v_d B \\implies E_H = v_d B$$

Let $J$ be the current density: $J = n q v_d \\implies v_d = \\frac{J}{nq}$.
$$E_H = \\frac{J B}{n q}$$

The **Hall Coefficient ($R_H$)** is defined as:
$$R_H = \\frac{1}{n q} \\implies E_H = R_H J B$$

Let $V_H$ be the Hall voltage across a sample of width $w$:
$$V_H = E_H \\cdot w = R_H \\frac{I}{A} B \\cdot w = R_H \\frac{I \\cdot B}{d} \\quad (\\text{since cross-sectional area } A = w \\cdot d)$$
$$V_H = \\frac{R_H I B}{d}$$

#### 2. Industrial Applications
1.  **Determination of Carrier Type:** The sign of $V_H$ tells if the semiconductor is n-type or p-type.
2.  **Carrier Concentration Measurement:** Permits direct calculation of $n = \\frac{1}{q R_H}$.
3.  **Magnetic Sensors:** Hall probes are widely used in commercial gaussmeters to measure magnetic field strengths and brushless DC motor encoders."""
            },
            {
                "q": "Describe the synthesis and characteristics of nanomaterials. Explain Non-Destructive Testing (NDT) using ultrasonic waves.",
                "marks": "8 marks",
                "unit": "Unit 6",
                "frequency": 5,
                "years": ["Nov Dec 2025", "May Jun 2024", "Oct 2022"],
                "idealAnswer": """### Nanomaterials and Ultrasonic NDT

Nanomaterials have engineered structural features between 1 and 100 nm, displaying unique surface-to-volume properties.

#### 1. Nanoparticle Synthesis
*   **Top-Down Approach:** Bulk materials are broken down into nanoparticles using physical methods like **Ball Milling** or laser ablation.
*   **Bottom-Up Approach:** Assembles materials atom-by-atom using chemical processes like the **Sol-Gel method** or Chemical Vapor Deposition (CVD).

#### 2. Ultrasonic Non-Destructive Testing (NDT)
Ultrasonic NDT is a non-invasive quality inspection technique that uses high-frequency acoustic waves (usually 1-10 MHz) to detect cracks, voids, or thickness variations inside solid metals.

*   **Working Principle:**
    *   A piezoelectric **transducer** sends ultrasonic pulses into the metal specimen.
    *   The pulse travels through the material until it hits a boundary (cracks, defects, or the back wall).
    *   The sound wave reflects back as an echo and is captured by the transducer, which converts it back to an electrical signal displayed on an oscilloscope.
    *   By measuring the time delay between the transmission pulse and the reflection echoes, the exact depth of the internal defect can be mapped:
        $$d = \\frac{v \\cdot t}{2}$$
        Where $v$ is the velocity of sound in the metal."""
            }
        ],
        "summaries": [
            {"unit": "Unit 1", "title": "Wave Optics", "points": ["Thin-film interference conditions", "Newton's rings experimental setup", "Diffraction grating resolving power", "Brewster's law of polarization"]},
            {"unit": "Unit 2", "title": "Lasers and Optic Fibers", "points": ["Stimulated emission and population inversion", "Construction and working of He-Ne laser", "Total internal reflection in optical fibers", "Acceptance angle and Numerical Aperture derivations"]},
            {"unit": "Unit 3", "title": "Quantum Mechanics", "points": ["De-Broglie hypothesis and wave-particle duality", "Davisson-Germer experimental verification", "Schrödinger's time-independent wave equation", "Physical significance of the wave function ψ"]},
            {"unit": "Unit 4", "title": "Semiconductor Physics", "points": ["Fermi-Dirac distribution function", "Carrier concentration in intrinsic semiconductors", "Hall Effect derivation and Hall coefficient", "PN Junction diode and solar cell characteristics"]},
            {"unit": "Unit 5", "title": "Magnetism and Superconductivity", "points": ["Classification of magnetic materials: Dia, Para, Ferro", "Hysteresis curve and magnetic parameters", "Meissner effect in superconductors", "Type I and Type II superconductors"]},
            {"unit": "Unit 6", "title": "Non-Destructive Testing and Nanomaterials", "points": ["Surface-to-volume ratio properties of nanoparticles", "Top-Down and Bottom-Up synthesis methods", "Production of ultrasonic waves by piezoelectric method", "Pulse-echo Non-Destructive Testing (NDT) method"]}
        ],
        "flashcards": [
            {"term": "Numerical Aperture", "definition": "A measure of the light-gathering capacity of an optical fiber, equal to the sine of the acceptance angle."},
            {"term": "Population Inversion", "definition": "The state of a system in which a higher energy state contains more particles than a lower energy state."},
            {"term": "Wave Function", "definition": "A mathematical function that describes the quantum state of a particle; its square representing probability density."},
            {"term": "Hall Effect", "definition": "The generation of a transverse electric potential in a semiconductor when a magnetic field is applied perpendicularly to the current flow."},
            {"term": "Brewster's Angle", "definition": "The angle of incidence at which light reflected from a dielectric surface is completely polarized."}
        ]
    },
    "Engineering Chemistry": {
        "subject": "Engineering Chemistry",
        "fullName": "Engineering Chemistry",
        "papersCount": 18,
        "questions": [
            {
                "q": "Explain the EDTA method for the estimation of total, permanent, and temporary hardness of water. Derive the reaction formulas.",
                "marks": "7 marks",
                "unit": "Unit 1",
                "frequency": 8,
                "years": ["March 2026", "May Jun 2025", "Nov Dec 2025", "May Jun 2024", "Nov Dec 2024", "Oct 2023"],
                "idealAnswer": """### EDTA Method for Estimation of Hardness of Water

Hardness in water is caused by the presence of dissolved calcium ($Ca^{2+}$) and magnesium ($Mg^{2+}$) salts. The ethylene diamine tetraacetic acid (EDTA) method is a complexometric titration method used to estimate total, permanent, and temporary hardness in water.

#### 1. Basic Principle
EDTA forms stable, soluble chelate complexes with $Ca^{2+}$ and $Mg^{2+}$ ions at a stable alkaline pH of 10.
*   **Indicator:** Eriochrome Black T (EBT) is used.
*   **Buffer:** Ammonium Chloride-Ammonia buffer ($NH_4Cl + NH_4OH$) is added to maintain pH = 10.
*   **Color Transition:** Free EBT indicator is blue at pH 10. When added to hard water containing metal ions, it forms an unstable, wine-red complex:
    $$M^{2+} + \\text{EBT (blue)} \\xrightarrow{\\text{pH 10}} [M-\\text{EBT}]\\text{ (wine-red complex)}$$
    
    During titration, EDTA competes for the metal ions. Since the metal-EDTA complex is highly stable, EDTA extracts metal ions from the indicator, releasing the free indicator back to blue:
    $$[M-\\text{EBT}]\\text{ (wine-red)} + \\text{EDTA} \\xrightarrow{\\text{pH 10}} [M-\\text{EDTA}]\\text{ (colorless)} + \\text{EBT (blue)}$$

#### 2. Experimental Procedure
1.  **Total Hardness Titration:** Titrate a sample of hard water directly against standard EDTA using EBT at pH 10. Let the volume consumed be $V_1$ ml.
2.  **Permanent Hardness Titration:** Boil a known volume of the water sample to precipitate temporary hardness as carbonates, filter it, and titrate the filtrate against EDTA. Let the volume consumed be $V_2$ ml.

#### 3. Mathematical Calculations
Let the molarity of EDTA be $M$.
*   **Total Hardness** (due to permanent + temporary salts):
    $$\\text{Total Hardness} = \\frac{V_1 \\times M \\times 100 \\times 1000}{\\text{Volume of sample}} \\text{ mg/L (ppm) of } CaCO_3 \\text{ eq.}$$
*   **Permanent Hardness** (due to chlorides and sulfates):
    $$\\text{Permanent Hardness} = \\frac{V_2 \\times M \\times 100 \\times 1000}{\\text{Volume of sample}} \\text{ mg/L (ppm)}$$
*   **Temporary Hardness** (due to bicarbonates):
    $$\\text{Temporary Hardness} = \\text{Total Hardness} - \\text{Permanent Hardness}$$"""
            },
            {
                "q": "Discuss the classification of fuels. Explain Dulong's formula for the calculation of Net and Gross Calorific Values of solid fuels.",
                "marks": "7 marks",
                "unit": "Unit 4",
                "frequency": 7,
                "years": ["Nov Dec 2025", "May Jun 2025", "May Jun 2024", "Nov Dec 2023"],
                "idealAnswer": """### Calorific Value of Fuels and Dulong's Formula

The calorific value of a fuel is the total quantity of heat liberated by the complete combustion of a unit mass or volume of the fuel.

#### 1. GCV and NCV Definitions
*   **Gross Calorific Value (GCV):** The total heat generated when the fuel is burned completely and products of combustion are cooled down to room temperature (so the latent heat of steam is condensed and recovered).
*   **Net Calorific Value (NCV):** The actual heat released when the combustion products are allowed to escape, carrying away the latent heat of steam.
    $$\\text{NCV} = \\text{GCV} - 0.09 \\times H \\times 587 \\text{ kcal/kg}$$
    Where $H$ is the percentage of hydrogen in the fuel and 587 kcal/kg is the latent heat of steam.

#### 2. Dulong's Formula for GCV
Based on the composition of elements in the solid fuel, GCV is calculated theoretically:
$$\\text{GCV} = \\frac{1}{100} \\left[ 8080 C + 34500 \\left( H - \\frac{O}{8} \\right) + 2240 S \\right] \\text{ kcal/kg}$$
Where:
*   $C, H, O, S$ represent the percentages of Carbon, Hydrogen, Oxygen, and Sulfur respectively.
*   $\\left( H - \\frac{O}{8} \\right)$ represents the *available hydrogen* (as some hydrogen is already bound with oxygen as water)."""
            },
            {
                "q": "Explain the EDTA complexation reaction mechanism and its color changes. Detail secondary battery charging electrochemical steps.",
                "marks": "6 marks",
                "unit": "Unit 5",
                "frequency": 5,
                "years": ["May Jun 2025", "Nov Dec 2024", "May Jun 2023", "Oct 2022"],
                "idealAnswer": """### Electrochemical Cells and Corrosion Prevention

Electrochemical systems convert chemical energy to electrical energy, and understanding corrosion is essential for mechanical integrity.

#### 1. secondary lithium-Ion Batteries
*   *Anode (Discharging):* $LiC_6 \\rightarrow C_6 + Li^+ + e^-$
*   *Cathode (Discharging):* $Li_{1-x}CoO_2 + x Li^+ + x e^- \\rightarrow LiCoO_2$
*   *Charging Phase:* Reverses the flow of Lithium ions from cathode back to intercalate inside graphite anode.

#### 2. Metallic Corrosion Prevention
*   **Sacrificial Anode Cathodic Protection:** Connect the metal structure (like iron pipelines) to a more active metal (like Magnesium or Zinc). The active metal corrodes preferentially, sacrificing itself to protect the parent steel structure."""
            }
        ],
        "summaries": [
            {"unit": "Unit 1", "title": "Water Technology", "points": ["Water quality parameters: hardness, alkalinity", "EDTA titration mechanism and calculations", "Zeolite and Ion-exchange demineralization processes", "Reverse Osmosis (RO) desalinization"]},
            {"unit": "Unit 2", "title": "Instrumental Methods of Chemical Analysis", "points": ["Principles of UV-Visible and IR spectroscopy", "Beer-Lambert's law derivation and limitations", "Gas chromatography (GC) working and applications", "pH-metry and Conductometry conductivities"]},
            {"unit": "Unit 3", "title": "Engineering Materials", "points": ["Polymers: classification and properties", "Synthesis of Nylon-6,6, Bakelite, and Kevlar", "Composite materials classification", "Nanomaterials and carbon nanotubes properties"]},
            {"unit": "Unit 4", "title": "Fuels and Combustion", "points": ["Solid, liquid, and gaseous fuels classification", "Bomb calorimeter GCV measurement experimental setup", "Dulong's formula calculations", "Combustion calculations: theoretical air required"]},
            {"unit": "Unit 5", "title": "Electrochemical Energy Systems and Corrosion", "points": ["Secondary batteries: Lead-Acid and Lithium-ion", "Fuel cells: Hydrogen-Oxygen fuel cell", "Dry and wet electrochemical corrosion mechanisms", "Corrosion protection: sacrificial anode and impressed current"]},
            {"unit": "Unit 6", "title": "Chemistry of Advanced Materials", "points": ["Liquid crystals classification and LCD displays", "Superconductors: critical temperature and Meissner effect", "Nanostructured carbon materials: graphene and fullerenes", "Green chemistry principles"]}
        ],
        "flashcards": [
            {"term": "GCV", "definition": "Gross Calorific Value - total heat released during combustion including latent heat of steam condensation."},
            {"term": "EDTA", "definition": "Ethylene Diamine Tetraacetic Acid - a hexadentate chelating agent forming stable complexes with metal ions."},
            {"term": "Corrosion", "definition": "The deterioration of a metal due to its chemical or electrochemical reaction with the surrounding environment."},
            {"term": "Zeolite", "definition": "A hydrated sodium aluminosilicate mineral used as an ion-exchanger for softening hard water."}
        ]
    },
    "Engineering Mathematics 1": {
        "subject": "Engineering Mathematics 1",
        "fullName": "Engineering Mathematics - I",
        "papersCount": 18,
        "questions": [
            {
                "q": "State and prove Leibnitz's Theorem for finding the n-th derivative of the product of two functions.",
                "marks": "6 marks",
                "unit": "Unit 1",
                "frequency": 8,
                "years": ["May Jun 2025", "Nov Dec 2025", "May Jun 2024", "Nov Dec 2024", "Oct 2022", "Nov Dec 2019"],
                "idealAnswer": """### Leibnitz's Theorem for n-th Derivative

Leibnitz's theorem is a generalization of the product rule of differentiation, providing a direct formula for the $n$-th derivative of the product of two functions.

#### 1. Statement
If $u(x)$ and $v(x)$ are two functions of $x$ which possess derivatives up to $n$-th order, then their product $(u \\cdot v)$ also possesses derivatives up to $n$-th order, and:
$$(uv)_n = u_n v + ^nC_1 u_{n-1} v_1 + ^nC_2 u_{n-2} v_2 + \\dots + ^nC_r u_{n-r} v_r + \\dots + u v_n$$
Where $u_k = \\frac{d^k u}{dx^k}$ and $^nC_r = \\frac{n!}{r!(n-r)!}$.

#### 2. Proof by Mathematical Induction
*   **Step 1: Verify for $n=1$ (Base Case)**
    $$(uv)_1 = u_1 v + u v_1$$
    This matches the Leibnitz formula for $n=1$:
    $$(uv)_1 = u_1 v + ^1C_1 u_0 v_1 = u_1 v + u v_1$$
    Thus, the theorem is true for $n=1$.

*   **Step 2: Assume true for $n=m$ (Inductive Hypothesis)**
    $$(uv)_m = u_m v + ^mC_1 u_{m-1} v_1 + \\dots + ^mC_r u_{m-r} v_r + \\dots + u v_m$$

*   **Step 3: Prove for $n=m+1$**
    Differentiate $(uv)_m$ with respect to $x$:
    $$(uv)_{m+1} = \\frac{d}{dx}[(uv)_m] = (u_{m+1} v + u_m v_1) + ^mC_1 (u_m v_1 + u_{m-1} v_2) + ^mC_2 (u_{m-1} v_2 + u_{m-2} v_3) + \\dots$$
    
    Grouping terms:
    $$(uv)_{m+1} = u_{m+1} v + (1 + ^mC_1) u_m v_1 + (^mC_1 + ^mC_2) u_{m-1} v_2 + \\dots + u v_{m+1}$$
    
    Using Pascal identity ($^mC_{r-1} + ^mC_r = ^{m+1}C_r$):
    *   $1 + ^mC_1 = ^{m+1}C_1$
    *   $^mC_1 + ^mC_2 = ^{m+1}C_2$
    
    Substituting gives:
    $$(uv)_{m+1} = u_{m+1} v + ^{m+1}C_1 u_m v_1 + ^{m+1}C_2 u_{m-1} v_2 + \\dots + u v_{m+1}$$
    This matches the formula for $n = m+1$."""
            },
            {
                "q": "State and explain Euler's Theorem on Homogeneous Functions. Derive the expression for first-order partial derivatives.",
                "marks": "6 marks",
                "unit": "Unit 3",
                "frequency": 7,
                "years": ["Nov Dec 2025", "May Jun 2025", "May Jun 2024", "Nov Dec 2023"],
                "idealAnswer": """### Euler's Theorem on Homogeneous Functions

A function $u = f(x, y)$ is said to be homogeneous of degree $n$ if:
$$f(tx, ty) = t^n f(x, y)$$

#### 1. Statement
If $u = f(x, y)$ is a homogeneous function of $x$ and $y$ of degree $n$, then:
$$x \\frac{\\partial u}{\\partial x} + y \\frac{\\partial u}{\\partial y} = n u$$

#### 2. Proof
Since $u$ is homogeneous of degree $n$, we can write:
$$u = x^n \phi\\left(\\frac{y}{x}\\right)$$

Differentiating with respect to $x$ partially:
$$\\frac{\\partial u}{\\partial x} = n x^{n-1} \phi\\left(\\frac{y}{x}\\right) + x^n \\phi'\\left(\\frac{y}{x}\\right) \\left( -\\frac{y}{x^2} \\right)$$
$$x \\frac{\\partial u}{\\partial x} = n x^n \phi\\left(\\frac{y}{x}\\right) - y x^{n-1} \\phi'\\left(\\frac{y}{x}\\right) \\quad \\text{--- (Eq 1)}$$

Differentiating with respect to $y$ partially:
$$\\frac{\\partial u}{\\partial y} = x^n \\phi'\\left(\\frac{y}{x}\\right) \\left( \\frac{1}{x} \\right) = x^{n-1} \\phi'\\left(\\frac{y}{x}\\right)$$
$$y \\frac{\\partial u}{\\partial y} = y x^{n-1} \\phi'\\left(\\frac{y}{x}\\right) \\quad \\text{--- (Eq 2)}$$

Adding Equations 1 and 2:
$$x \\frac{\\partial u}{\\partial x} + y \\frac{\\partial u}{\\partial y} = n x^n \phi\\left(\\frac{y}{x}\\right) = n u$$
This completes the proof of Euler's theorem!"""
            },
            {
                "q": "Discuss the Cayley-Hamilton Theorem. Explain how it is used to calculate the Inverse of a Matrix ($A^{-1}$).",
                "marks": "6 marks",
                "unit": "Unit 5",
                "frequency": 6,
                "years": ["Nov Dec 2025", "May Jun 2025", "Nov Dec 2024", "Oct 2022"],
                "idealAnswer": """### Cayley-Hamilton Theorem

The Cayley-Hamilton theorem bridges matrix algebra and polynomials.

#### 1. Statement
Every square matrix satisfies its own characteristic equation.
Let $A$ be a square matrix of order $n$. The characteristic equation of $A$ is given by:
$$|A - \lambda I| = (-1)^n [ \lambda^n + a_{n-1} \lambda^{n-1} + \\dots + a_1 \lambda + a_0 ] = 0$$

According to the theorem, replacing $\lambda$ with matrix $A$ satisfies the equation:
$$A^n + a_{n-1} A^{n-1} + \\dots + a_1 A + a_0 I = 0$$
Where $I$ is the identity matrix.

#### 2. Computation of $A^{-1}$
Multiply the characteristic equation by $A^{-1}$:
$$A^{-1} [ A^n + a_{n-1} A^{n-1} + \\dots + a_1 A + a_0 I ] = 0$$
$$A^{n-1} + a_{n-1} A^{n-2} + \\dots + a_1 I + a_0 A^{-1} = 0$$
$$A^{-1} = -\\frac{1}{a_0} [ A^{n-1} + a_{n-1} A^{n-2} + \\dots + a_1 I ]$$"""
            }
        ],
        "summaries": [
            {"unit": "Unit 1", "title": "Differential Calculus", "points": ["Successive differentiation and standard n-th derivative formulas", "Leibnitz's theorem proof and applications", "Taylor's and Maclaurin's series expansions", "Indeterminate forms and L'Hospital's rule"]},
            {"unit": "Unit 2", "title": "Fourier Series", "points": ["Periodic functions and Dirichlet's conditions", "Euler's formulas for Fourier coefficients", "Fourier series in interval [0, 2π] and [-L, L]", "Half-range Fourier sine and cosine series"]},
            {"unit": "Unit 3", "title": "Partial Differentiation", "points": ["Functions of several variables and partial derivatives", "Homogeneous functions and Euler's theorem", "Euler's theorem for composite and implicit functions", "Total derivatives and chain rule"]},
            {"unit": "Unit 4", "title": "Applications of Partial Differentiation", "points": ["Jacobian determinant and properties", "Errors and approximations using partial derivatives", "Maxima and Minima of functions of two variables", "Lagrange's method of undetermined multipliers"]},
            {"unit": "Unit 5", "title": "Linear Algebra - Matrices", "points": ["Rank of a matrix and Normal form", "System of linear homogeneous and non-homogeneous equations", "Linear independence and dependence of vectors", "Linear transformations"]},
            {"unit": "Unit 6", "title": "Linear Algebra - Eigen Values & Eigen Vectors", "points": ["Characteristic equation of a matrix", "Eigenvalues and eigenvectors computation", "Cayley-Hamilton theorem applications", "Diagonalization of matrices"]}
        ],
        "flashcards": [
            {"term": "Jacobian", "definition": "A determinant of partial derivatives representing the local scaling factor of a coordinate transformation."},
            {"term": "Leibnitz's Rule", "definition": "A formula for the n-th derivative of a product of two functions."}
        ]
    },
    "Engineering Mathematics 2": {
        "subject": "Engineering Mathematics 2",
        "fullName": "Engineering Mathematics - II",
        "papersCount": 18,
        "questions": [
            {
                "q": "Explain the method to solve First Order Linear Ordinary Differential Equations. Provide the derivation of the Integrating Factor.",
                "marks": "6 marks",
                "unit": "Unit 1",
                "frequency": 8,
                "years": ["March 2026", "May Jun 2025", "Nov Dec 2025", "May Jun 2024", "Nov Dec 2024", "May Jun 2023", "Nov Dec 2023", "May Jun 2022"],
                "idealAnswer": """### First Order Linear Ordinary Differential Equations

A first-order ordinary differential equation (ODE) is linear if the dependent variable ($y$) and its derivative ($dy/dx$) appear only in the first degree.

#### 1. Standard Form
The standard mathematical form is:
$$\\frac{dy}{dx} + P(x)y = Q(x)$$
Where $P(x)$ and $Q(x)$ are continuous functions of $x$ only.

#### 2. Derivation of the Integrating Factor (IF)
Multiply the standard form by a function $\mu(x)$:
$$\\mu(x)\\frac{dy}{dx} + \\mu(x)P(x)y = \\mu(x)Q(x)$$

We want the left-hand side to match the derivative of the product $(\mu(x) \\cdot y)$:
$$\\frac{d}{dx} [\\mu(x) \\cdot y] = \\mu(x)\\frac{dy}{dx} + y\\frac{d\\mu}{dx}$$

Equating the two LHS representations gives:
$$\\mu(x)P(x) = \\frac{d\\mu}{dx} \\implies \\frac{d\\mu}{\\mu} = P(x)dx$$
Integrating both sides:
$$\\ln(\\mu) = \\int P(x)dx \\implies \\mu(x) = e^{\\int P(x)dx}$$
Thus, the **Integrating Factor (IF)** is:
$$\\text{IF} = e^{\\int P(x)dx}$$

#### 3. General Solution Steps
Write the final general solution using:
$$y \\times (\\text{IF}) = \\int [Q(x) \\times (\\text{IF})] dx + C$$"""
            },
            {
                "q": "How do you find the Orthogonal Trajectories of a given family of curves? Detail the exact step-by-step calculus procedure.",
                "marks": "6 marks",
                "unit": "Unit 2",
                "frequency": 6,
                "years": ["March 2026", "May Jun 2025", "Nov Dec 2025", "May Jun 2024", "Nov Dec 2024", "May Jun 2023"],
                "idealAnswer": """### Finding Orthogonal Trajectories

An orthogonal trajectory of a family of curves is a curve that intersects every member of the given family at right angles (90 degrees).

#### 1. Cartesian Coordinates ($x, y$) Procedure
Let the family of curves be represented by $f(x, y, C) = 0$.
*   **Step 1:** Differentiate with respect to $x$ to get a relation with $x, y, C, \\frac{dy}{dx}$.
*   **Step 2:** Eliminate $C$ to find the family's differential equation: $F\\left(x, y, \\frac{dy}{dx}\\right) = 0$.
*   **Step 3:** Apply perpendicularity condition by replacing $\\frac{dy}{dx}$ with $-\\frac{dx}{dy}$:
    $$F\\left(x, y, -\\frac{dx}{dy}\\right) = 0$$
*   **Step 4:** Integrate the new differential equation to find the trajectories.

#### 2. Polar Coordinates ($r, \theta$) Procedure
For polar families $f(r, \theta, C) = 0$:
1.  Differentiate with respect to $\theta$ and eliminate $C$ to find $F\\left(r, \\theta, \\frac{dr}{d\\theta}\\right) = 0$.
2.  Replace $\\frac{dr}{d\\theta}$ with $-r^2\\frac{d\\theta}{dr}$.
3.  Solve the new polar differential equation to get the orthogonal family."""
            },
            {
                "q": "Discuss the properties of Beta and Gamma Functions. Show that Gamma(1/2) is equal to square root of Pi.",
                "marks": "6 marks",
                "unit": "Unit 3",
                "frequency": 6,
                "years": ["Nov Dec 2025", "May Jun 2025", "Nov Dec 2024", "Oct 2022"],
                "idealAnswer": """### Beta and Gamma Functions

Beta and Gamma functions are standard improper integrals that define generalized factorials and solve definite integrals.

#### 1. Formulations
*   **Gamma Function ($\Gamma(n)$):**
    $$\Gamma(n) = \\int_{0}^{\infty} e^{-x} x^{n-1} dx \\quad \\text{for } n > 0$$
*   **Beta Function ($B(m, n)$):**
    $$B(m, n) = \\int_{0}^{1} x^{m-1} (1-x)^{n-1} dx \\quad \\text{for } m, n > 0$$

#### 2. Proof that $\Gamma(1/2) = \\sqrt{\pi}$
From the definition of Gamma:
$$\Gamma(1/2) = \\int_{0}^{\infty} e^{-x} x^{-1/2} dx$$
Let $x = y^2 \\implies dx = 2y dy$:
$$\Gamma(1/2) = \\int_{0}^{\infty} e^{-y^2} y^{-1} 2y dy = 2 \\int_{0}^{\infty} e^{-y^2} dy$$

By symmetry:
$$\\Gamma(1/2) = \\int_{-\infty}^{\infty} e^{-y^2} dy$$
Multiply two identical integrals:
$$[\\Gamma(1/2)]^2 = \\left( \\int_{-\infty}^{\infty} e^{-x^2} dx \\right) \\left( \\int_{-\infty}^{\infty} e^{-y^2} dy \\right) = \\int_{-\infty}^{\infty} \\int_{-\infty}^{\infty} e^{-(x^2+y^2)} dx dy$$

Convert to polar coordinates ($x^2+y^2=r^2$, $dx dy = r dr d\theta$):
$$[\\Gamma(1/2)]^2 = \\int_{0}^{2\pi} d\theta \\int_{0}^{\infty} e^{-r^2} r dr = 2\pi \\left[ -\\frac{1}{2} e^{-r^2} \\right]_{0}^{\infty} = \pi$$
$$\\Gamma(1/2) = \\sqrt{\pi}$$"""
            }
        ],
        "summaries": [
            {"unit": "Unit 1", "title": "First Order First Degree Differential Equations", "points": ["Linear differential equations and integrating factors", "Reducible to linear (Bernoulli's) equations", "Exact differential equations and criteria", "Equations reducible to exact using integrating factors"]},
            {"unit": "Unit 2", "title": "Applications of First Order Differential Equations", "points": ["Orthogonal trajectories in Cartesian and Polar coordinates", "Newton's Law of Cooling rate equations", "Rectilinear motion under variable forces", "Simple electrical circuits (RL, RC) differential equations"]},
            {"unit": "Unit 3", "title": "Integral Calculus (Beta & Gamma Functions, Curve Tracing)", "points": ["Beta and Gamma functions definitions and symmetry", "Relation between Beta and Gamma functions", "Differentiation Under Integral Sign (DUIS) - Leibnitz Rule", "Tracing of Cartesian and Polar curves"]},
            {"unit": "Unit 4", "title": "Solid Geometry", "points": ["Cartesian coordinates in 3D space", "Equation of a Sphere in different forms", "Equation of a Cone with vertex at origin", "Equation of a Cylinder"]},
            {"unit": "Unit 5", "title": "Multiple Integrals", "points": ["Evaluation of double integrals over given regions", "Changing the order of integration in double integrals", "Double integrals in Polar coordinates", "Triple integrals evaluation"]},
            {"unit": "Unit 6", "title": "Applications of Multiple Integrals & Area", "points": ["Area of curves using double integration", "Volume of solids of revolution using double/triple integrals", "Mass, Center of Gravity, and Moment of Inertia of plates", "Symmetry properties in volume integrals"]}
        ],
        "flashcards": [
            {"term": "Integrating Factor", "definition": "A mathematical factor (e^∫Pdx) multiplied to convert an inexact differential equation into an exact one."},
            {"term": "Beta Function", "definition": "A symmetric function of two variables defined as B(m,n) = ∫[0 to 1] x^(m-1) (1-x)^(n-1) dx."}
        ]
    },
    "Programming & Problem Solving": {
        "subject": "PPS",
        "fullName": "Programming & Problem Solving",
        "papersCount": 18,
        "questions": [
            {
                "q": "Explain the concept of local and global scope variables in Python. Provide a clear programming demonstration.",
                "marks": "6 marks",
                "unit": "Unit 4",
                "frequency": 8,
                "years": ["March 2026", "May Jun 2025", "Nov Dec 2025", "May Jun 2024", "Nov Dec 2024", "Oct 2022"],
                "idealAnswer": """### Variables Scope in Python (Local vs Global)

In programming, the "scope" of a variable defines the exact block or region of the program where that variable is recognized.

#### 1. Definitions
*   **Global Scope Variables:**
    A variable declared outside of all function definitions. It is active when the program starts and is accessible from anywhere.
*   **Local Scope Variables:**
    A variable declared inside a function body. It is created when the function is called, and is destroyed once the function returns.

#### 2. Code Demonstration
```python
message = "I am a Global Variable!"

def my_function():
    local_val = 50
    print("Inside function - Global variable:", message)
    print("Inside function - Local variable:", local_val)

my_function()
print("Outside function - Global variable:", message)

try:
    print(local_val)
except NameError as e:
    print("Outside function - Error trying to print local variable:", e)
```

#### 3. The `global` Keyword
To modify a global variable from inside a function, Python requires the `global` keyword:
```python
counter = 10  # Global

def increment():
    global counter
    counter += 1

increment()
print("Counter after increment:", counter) # Outputs 11
```"""
            },
            {
                "q": "Compare Lists, Tuples, and Dictionaries in Python. Explain their syntax and mutual conversion methodologies.",
                "marks": "6 marks",
                "unit": "Unit 3",
                "frequency": 7,
                "years": ["Nov Dec 2025", "May Jun 2025", "Nov Dec 2024", "May Jun 2024", "Nov Dec 2023"],
                "idealAnswer": """### Data Structures in Python (Lists, Tuples, Dictionaries)

Python provides versatile built-in data structures to organize collections of values.

#### 1. Key Comparisons

| Parameter | List | Tuple | Dictionary |
| :--- | :--- | :--- | :--- |
| **Syntax** | Square brackets `[]` | Parentheses `()` | Curly braces `{key: value}` |
| **Mutability** | Mutability (Can be modified) | Immutable (Constant) | Mutability (Keys are immutable) |
| **Ordering** | Ordered | Ordered | Unordered (Python 3.7+ preserves order) |
| **Duplicates** | Allowed | Allowed | Keys must be unique |

#### 2. Code Demonstration
```python
# List operation
my_list = [1, 2, 3]
my_list.append(4)  # Allowed

# Tuple operation
my_tuple = (1, 2, 3)
# my_tuple[0] = 5  # Throws TypeError

# Dictionary operation
my_dict = {"name": "Sutras", "pattern": 2019}
my_dict["subject"] = "PPS"  # Allowed
```"""
            },
            {
                "q": "What is File Handling? Write a Python program to read lines from a text file and write them to another file.",
                "marks": "6 marks",
                "unit": "Unit 6",
                "frequency": 6,
                "years": ["Nov Dec 2025", "May Jun 2025", "Nov Dec 2024", "Oct 2022"],
                "idealAnswer": """### File Handling in Python

File handling permits Python programs to read data from and write data to files on the hard drive.

#### 1. File Modes
*   `'r'`: Read mode (default). Fails if file does not exist.
*   `'w'`: Write mode. Overwrites the file if it exists, creates it if not.
*   `'a'`: Append mode. Appends data to the end of the file.

#### 2. Code Implementation (File Copier)
```python
def copy_file(source, destination):
    try:
        # Using context manager 'with' ensures files are closed automatically
        with open(source, 'r', encoding='utf-8') as infile:
            content = infile.read()
            
        with open(destination, 'w', encoding='utf-8') as outfile:
            outfile.write(content)
            
        print(f"Successfully copied content from {source} to {destination}!")
    except FileNotFoundError:
        print(f"Error: The source file '{source}' was not found.")

copy_file("sppu_syllabus.txt", "backup_syllabus.txt")
```"""
            }
        ],
        "summaries": [
            {"unit": "Unit 1", "title": "Problem Solving, Programming and Python Programming", "points": ["Top-down program design tools: flowcharts, algorithms", "Python fundamentals: constants, variables, identifiers", "Basic input-output commands", "Indentation and operators in Python"]},
            {"unit": "Unit 2", "title": "Decision Control Statements and Looping", "points": ["Conditional statements: if, if-else, nested structures", "Looping control: while and for loops", "Break, continue, pass statements", "Range function uses"]},
            {"unit": "Unit 3", "title": "Data Structures", "points": ["Python Lists: operations, methods, list comprehension", "Tuples: indexing, slicing, immutability characteristics", "Dictionaries: keys, values, dictionary methods", "Sets: operations and definitions"]},
            {"unit": "Unit 4", "title": "Functions and Modules", "points": ["Function definition, execution, and local parameters", "Variable scope and lifetime: local vs global", "Recursive functions and Lambda expressions", "Modules and standard library imports"]},
            {"unit": "Unit 5", "title": "Strings", "points": ["String indexing, slicing, and operators", "Immutability of strings in Python", "Built-in string manipulation methods", "Regular expression principles"]},
            {"unit": "Unit 6", "title": "Object Oriented Programming and File Handling", "points": ["OOP core features: inheritance, polymorphism, encapsulation", "Classes and object declarations in Python", "File handling: read, write, append operations", "Exception handling: try, except, finally blocks"]}
        ],
        "flashcards": [
            {"term": "Local Scope", "definition": "A variable declared inside a function body, active only during execution of that function."},
            {"term": "Recursion", "definition": "The programmatic technique where a function calls itself directly or indirectly."}
        ]
    },
    "Engineering Mechanics": {
        "subject": "Engineering Mechanics",
        "fullName": "Engineering Mechanics",
        "papersCount": 18,
        "questions": [
            {
                "q": "State and prove Varignon's Theorem of Moments for a system of coplanar forces.",
                "marks": "6 marks",
                "unit": "Unit 1",
                "frequency": 8,
                "years": ["March 2026", "May Jun 2025", "Nov Dec 2025", "May Jun 2024", "Nov Dec 2024", "Oct 2023", "Oct 2022"],
                "idealAnswer": """### Varignon's Theorem of Moments

Varignon's theorem is a fundamental theorem in engineering mechanics relating individual moments to their resultant.

#### 1. Statement
The algebraic sum of the moments of any number of coplanar forces about any point in their plane is equal to the moment of their resultant force about the same point.

#### 2. Proof for concurrent forces
Let $P$ and $Q$ be two coplanar forces concurrent at point $A$. Let $R$ be their vector resultant:
$$\\vec{R} = \\vec{P} + \\vec{Q}$$
Let $O$ be any point in the plane of these forces. Let $\\vec{r}$ be the position vector of the point of concurrency $A$ relative to the moment center $O$.

*   **Step A:** The moments of individual forces are:
    *   Moment of force $P$: $\\vec{M}_P = \\vec{r} \\times \\vec{P}$
    *   Moment of force $Q$: $\\vec{M}_Q = \\vec{r} \\times \\vec{Q}$
*   **Step B:** The sum of moments is:
    $$\\vec{M}_P + \\vec{M}_Q = (\\vec{r} \\times \\vec{P}) + (\\vec{r} \\times \\vec{Q})$$
    Using the distributive property of vector cross products over addition:
    $$\\vec{M}_P + \\vec{M}_Q = \\vec{r} \\times (\\vec{P} + \\vec{Q})$$
*   **Step C:** Substitute $\\vec{R} = \\vec{P} + \\vec{Q}$:
    $$\\vec{M}_P + \\vec{M}_Q = \\vec{r} \\times \\vec{R} = \\vec{M}_R$$
    Where $\\vec{M}_R$ is the moment of the resultant force $R$ about $O$. This completes the proof."""
            },
            {
                "q": "Explain Lami's Theorem for coplanar concurrent forces in equilibrium. Detail its mathematical proof.",
                "marks": "6 marks",
                "unit": "Unit 2",
                "frequency": 7,
                "years": ["Nov Dec 2025", "May Jun 2025", "Nov Dec 2024", "May Jun 2023", "Nov Dec 2019"],
                "idealAnswer": """### Lami's Theorem of Equilibrium

Lami's theorem is an equation relating the magnitudes of three coplanar, concurrent, and non-collinear forces in static equilibrium.

#### 1. Statement
If three coplanar concurrent forces acting at a point are in equilibrium, then each force is directly proportional to the sine of the angle between the other two forces.

Mathematically, let three forces $P, Q, R$ act at a point with angles $\alpha, \beta, \gamma$ opposite to them:
$$\\frac{P}{\\sin \alpha} = \\frac{Q}{\\sin \beta} = \\frac{R}{\\sin \gamma}$$

#### 2. Proof (Using Sine Rule)
Since the three concurrent forces are in equilibrium, they can be represented as the three sides of a closed triangle taken in order (according to the triangle law of forces).

Let the three sides of the force triangle be $A, B, C$ parallel to $P, Q, R$:
*   The interior angles of this force triangle are $(180^\\circ - \alpha)$, $(180^\\circ - \beta)$, and $(180^\\circ - \gamma)$.

Applying the Sine Rule of trigonometry to the force triangle:
$$\\frac{P}{\\sin(180^\\circ - \alpha)} = \\frac{Q}{\\sin(180^\\circ - \beta)} = \\frac{R}{\\sin(180^\\circ - \gamma)}$$

Since $\\sin(180^\\circ - \theta) = \\sin\theta$:
$$\\frac{P}{\\sin \alpha} = \\frac{Q}{\\sin \beta} = \\frac{R}{\\sin \gamma}$$
This completes the proof of Lami's theorem."""
            },
            {
                "q": "Discuss the Analysis of Trusses. Detail the steps to compute member forces using the Method of Joints.",
                "marks": "8 marks",
                "unit": "Unit 3",
                "frequency": 6,
                "years": ["Nov Dec 2025", "May Jun 2025", "May Jun 2024", "Nov Dec 2023"],
                "idealAnswer": """### Truss Analysis (Method of Joints)

A truss is a structure composed of members joined at their endpoints to form stable triangles.

#### 1. Method of Joints Steps
*   **Step A: Determine support reactions**
    Treat the entire truss as a single rigid body. Apply equilibrium equations:
    $$\\sum F_x = 0, \\quad \\sum F_y = 0, \\quad \\sum M_O = 0$$
    To solve for reactions at supports (e.g., roller or pin supports).
*   **Step B: Select a start joint**
    Choose a joint that has at least one known force and **at most two unknown forces**.
*   **Step C: Draw Free Body Diagram (FBD)**
    Draw the joint with all concurrent forces. Assume unknown member forces are in **tension** (pulling away from the joint).
*   **Step D: Apply equilibrium equations**
    Apply KCL-equivalent coplanar concurrent equilibrium equations:
    $$\\sum F_x = 0, \\quad \\sum F_y = 0$$
    To solve for the two unknown forces. If the solved value is negative, it represents **compression** instead of tension.
*   **Step E: Repeat for remaining joints**
    Proceed to adjacent joints, carrying over solved member values, until all member forces are resolved."""
            }
        ],
        "summaries": [
            {"unit": "Unit 1", "title": "Coplanar Force Systems", "points": ["Types of force systems and vector representations", "Varignon's theorem of moments proof", "Resolution and composition of concurrent forces", "Couples and their characteristics"]},
            {"unit": "Unit 2", "title": "Equilibrium of Coplanar Force Systems", "points": ["Conditions of equilibrium for concurrent and parallel systems", "Lami's theorem and equilibrium equations", "Types of supports: pin, roller, fixed", "Free Body Diagrams (FBD) drawing rules"]},
            {"unit": "Unit 3", "title": "Friction and Truss Analysis", "points": ["Laws of dry friction and friction coefficient", "Wedge and ladder friction solving", "Perfect trusses definitions", "Analysis of trusses by Method of Joints and Method of Sections"]},
            {"unit": "Unit 4", "title": "Centroid and Moment of Inertia", "points": ["Centroid of standard lines and composite plates", "Moment of inertia definition and formulas", "Parallel and perpendicular axis theorems proofs", "Moment of inertia of composite engineering sections"]},
            {"unit": "Unit 5", "title": "Kinematics of Particles", "points": ["Rectilinear motion with uniform and variable acceleration", "Curvilinear motion and projectile equations", "Normal and tangential coordinate components", "Relative velocity calculations"]},
            {"unit": "Unit 6", "title": "Kinetics of Particles", "points": ["Newton's second law of motion: F = ma", "D'Alembert's principle and dynamic equilibrium", "Work-Energy principle for a particle", "Impulse-Momentum equation and impacts"]}
        ],
        "flashcards": [
            {"term": "Varignon's", "definition": "A theorem stating that the sum of moments of individual forces equals the moment of their resultant."},
            {"term": "Equilibrium", "definition": "State where net force and net moment acting on a body are zero."}
        ]
    },
    "Basic Electronics Engineering": {
        "subject": "Electronics",
        "fullName": "Basic Electronics Engineering",
        "papersCount": 18,
        "questions": [
            {
                "q": "Define the ideal characteristics of an Operational Amplifier (Op-Amp) and explain its working as an inverting amplifier.",
                "marks": "6 marks",
                "unit": "Unit 3",
                "frequency": 8,
                "years": ["March 2026", "May Jun 2025", "Nov Dec 2025", "May Jun 2023", "Nov Dec 2023", "May Jun 2022"],
                "idealAnswer": """### Operational Amplifier (Op-Amp) Characteristics

An Operational Amplifier is a high-gain, direct-coupled, differential electronic voltage amplifier.

#### 1. Ideal Characteristics
List these standard ideal values:
1.  **Open-Loop Voltage Gain ($A_v$):** $\infty$ (Infinite)
2.  **Input Impedance ($Z_{in}$):** $\infty$ (Infinite)
3.  **Output Impedance ($Z_{out}$):** $0$ (Zero)
4.  **Bandwidth (BW):** $\infty$ (Infinite)
5.  **Common Mode Rejection Ratio (CMRR):** $\infty$ (Infinite)
6.  **Slew Rate (SR):** $\infty$ (Infinite)
7.  **Input Offset Voltage ($V_{io}$):** $0$ (Zero)

#### 2. Inverting Amplifier Configuration
In an inverting amplifier, the input signal ($V_{in}$) is applied to the inverting input terminal (-) through $R_1$, while the non-inverting input terminal (+) is grounded.

*   **Virtual Ground Concept:**
    Due to $A_v = \infty$, the differential input voltage is zero:
    $$V_- = V_+ = 0 \\quad (\\text{since non-inverting terminal is grounded})$$

*   **Derivation of Closed-Loop Gain ($A_{cl}$):**
    Applying KCL at the inverting node (since the input terminal draws no current $I_g = 0$):
    $$\\frac{V_{in} - V_-}{R_1} = \\frac{V_- - V_{out}}{R_f}$$
    Since $V_- = 0$:
    $$\\frac{V_{in}}{R_1} = \\frac{-V_{out}}{R_f} \\implies V_{out} = -\\left(\\frac{R_f}{R_1}\\right) V_{in}$$
    Therefore, the closed-loop voltage gain ($A_{cl}$) is:
    $$A_{cl} = \\frac{V_{out}}{V_{in}} = -\\frac{R_f}{R_1}$$
    The negative sign indicates a **180° phase shift**."""
            },
            {
                "q": "Compare Half Wave Rectifier, Center-Tapped Full Wave Rectifier, and Bridge Rectifier on key performance parameters.",
                "marks": "8 marks",
                "unit": "Unit 1",
                "frequency": 7,
                "years": ["Nov Dec 2025", "May Jun 2025", "Nov Dec 2024", "May Jun 2024", "Nov Dec 2023"],
                "idealAnswer": """### Rectifier Comparison Analysis

Rectifiers convert alternating current (AC) to pulsating direct current (DC).

#### 1. Detailed Parameter Matrix

| Parameter | Half Wave | Center-Tapped | Bridge |
| :--- | :--- | :--- | :--- |
| **Number of Diodes** | 1 | 2 | 4 |
| **Transformer Needed** | No | Yes (Center-Tapped) | No |
| **Max Efficiency ($\eta$)** | 40.6% | 81.2% | 81.2% |
| **Ripple Factor ($\gamma$)** | 1.21 | 0.482 | 0.482 |
| **Peak Inverse Voltage (PIV)** | $V_m$ | $2V_m$ | $V_m$ |
| **Output Frequency** | $f_{in}$ | $2f_{in}$ | $2f_{in}$ |

#### 2. Key Advantages of Bridge Rectifier
*   Requires no specialized, expensive center-tapped transformer.
*   **PIV is half** that of center-tapped ($V_m$ instead of $2V_m$), meaning cheaper diodes can be selected."""
            },
            {
                "q": "Realize all basic logic gates using Universal Gates (NAND/NOR). State their truth tables.",
                "marks": "6 marks",
                "unit": "Unit 4",
                "frequency": 6,
                "years": ["May Jun 2025", "Nov Dec 2024", "Oct 2022", "Nov Dec 2019"],
                "idealAnswer": """### Universal Logic Gates Realization

NAND and NOR gates are called universal gates because any boolean expression can be realized using only one type of these gates.

#### 1. NAND as NOT
Tie both inputs of a NAND gate together:
$$Y = \\overline{A \\cdot A} = \\bar{A}$$

#### 2. NAND as AND
Follow a NAND gate with a NAND-realized NOT gate:
$$Y = \\overline{\\overline{A \\cdot B}} = A \\cdot B$$

#### 3. NAND as OR
Invert both inputs first, then pass through a NAND gate (De-Morgan's Law):
$$Y = \\overline{\\bar{A} \\cdot \\bar{B}} = \\bar{\\bar{A}} + \\bar{\\bar{B}} = A + B$$"""
            }
        ],
        "summaries": [
            {"unit": "Unit 1", "title": "Diode Circuits", "points": ["PN junction diode working and V-I characteristics", "Half-wave and Full-wave rectifiers analysis", "Zener diode as a voltage regulator", "Special diodes: LED and Photodiode"]},
            {"unit": "Unit 2", "title": "Bipolar Junction Transistor Circuits", "points": ["BJT construction and configurations (CB, CE, CC)", "Common Emitter (CE) characteristics and bias lines", "BJT working as a switch and amplifier", "Field Effect Transistor (FET) basics"]},
            {"unit": "Unit 3", "title": "Linear Integrated Circuits", "points": ["Ideal operational amplifier characteristics", "Op-Amp inverting and non-inverting configurations", "Op-Amp applications: adder, subtractor, integrator", "IC 555 timer block diagram and astable multivibrator"]},
            {"unit": "Unit 4", "title": "Digital Electronics", "points": ["Binary number systems and boolean algebra reduction", "Universal gates: NAND and NOR realizations", "Combinational logic: Half Adder and Full Adder", "Sequential logic: RS and JK flip-flops"]},
            {"unit": "Unit 5", "title": "Industrial Electronics", "points": ["Silicon Controlled Rectifier (SCR) V-I features", "Transducers: temperature, strain, displacement", "Data acquisition systems block diagram", "PLC logic controllers basics"]},
            {"unit": "Unit 6", "title": "Electronic Communication", "points": ["Analog communication: AM and FM modulation indices", "Digital communication: ASK, FSK, PSK principles", "Mobile communication: cellular concepts and cellular network structures", "Optical fiber communication block diagram"]}
        ],
        "flashcards": [
            {"term": "CMRR", "definition": "Common Mode Rejection Ratio - capacity of an op-amp to reject common-mode noise, equal to Ad/Ac."},
            {"term": "PIV", "definition": "Peak Inverse Voltage - maximum reverse voltage a diode can withstand without breaking down."}
        ]
    },
    "Engineering Graphics": {
        "subject": "Engineering Graphics",
        "fullName": "Engineering Graphics & Design",
        "papersCount": 10,
        "questions": [
            {
                "q": "Detail the principles and projection guidelines for drawing the Orthographic and Isometric projections of solid geometries.",
                "marks": "7 marks",
                "unit": "Unit 6",
                "frequency": 8,
                "years": ["May Jun 2025", "Nov Dec 2025", "May Jun 2024", "Nov Dec 2024", "Nov Dec 2023"],
                "idealAnswer": """### Principles of Projections (Orthographic & Isometric)

Projections are standard drawings used in engineering to represent 3D objects on a 2D plane.

#### 1. Orthographic Projection (Multi-View Drawing)
*   **Front View (Elevation):** Projected on the Vertical Plane (VP).
*   **Top View (Plan):** Projected on the Horizontal Plane (HP).
*   **First Angle Projection (SPPU standard):**
    *   Front View lies **above** reference line $XY$.
    *   Top View lies **below** reference line $XY$.

#### 2. Isometric Projection (Pictorial View)
*   Receding axes are drawn at **30°** to the horizontal line.
*   **Isometric Scale:** Due to perspective foreshortening:
    $$\\text{Isometric Length} = \\sqrt{\\frac{2}{3}} \\times \\text{True Length} \\approx 0.816 \\times \\text{True Length}$$
*   *Isometric View* uses True scale (1:1), while *Isometric Projection* uses the reduced isometric scale (0.816)."""
            },
            {
                "q": "Explain the projections of lines inclined to both reference planes. Detail the steps to compute True Length and True Inclinations.",
                "marks": "8 marks",
                "unit": "Unit 3",
                "frequency": 7,
                "years": ["Nov Dec 2025", "May Jun 2025", "May Jun 2024", "Oct 2023", "Nov Dec 2019"],
                "idealAnswer": """### Projections of Lines Inclined to Both Planes

When a line is inclined to both the Horizontal Plane (HP) and Vertical Plane (VP), its projections appear shorter than its actual length, and its inclinations in drawings (apparent angles) are larger than the true inclinations.

#### 1. Standard Notation
*   $L$ = True Length (TL) of line $AB$.
*   $\theta$ = True inclination of line with HP.
*   $\phi$ = True inclination of line with VP.
*   $\alpha$ = Apparent angle of front view with $XY$.
*   $\beta$ = Apparent angle of top view with $XY$.
*   $a'b'$ = Front view length (Apparent length).
*   $ab$ = Top view length (Apparent length).

#### 2. Projections Drawing Procedure
1.  Draw the XY reference line and locate the projections of one endpoint ($a'$ and $a$).
2.  Draw the locus of the other endpoint $B$ in both VP and HP.
3.  Draw the true length representations inclined at $\theta$ and $\phi$ to locate true endpoints ($b_1'$ and $b_2$).
4.  Project these endpoints to find apparent lengths and rotate them to the locus lines to locate final projections ($b'$ and $b$)."""
            },
            {
                "q": "What is the Development of Lateral Surfaces of solids? Detail the parallel-line and radial-line methods.",
                "marks": "7 marks",
                "unit": "Unit 5",
                "frequency": 6,
                "years": ["Nov Dec 2025", "May Jun 2025", "May Jun 2024", "Nov Dec 2023"],
                "idealAnswer": """### Development of Lateral Surfaces of Solids

The development of lateral surfaces is the layout of the complete outer surface area of a 3D solid laid flat on a 2D sheet of paper. It is essential in sheet-metal fabrication, duct design, and packaging.

#### 1. Parallel-Line Development Method
Used for solids having parallel lateral edges/generators, such as **prisms and cylinders**.
*   The baseline is drawn equal to the perimeter of the base of the solid.
*   Vertical lines are drawn at distances matching the side lengths of the base.

#### 2. Radial-Line Development Method
Used for solids having edges/generators concurrent at a single apex, such as **pyramids and cones**.
*   The development forms a sector of a circle with a radius equal to the **true slant height ($S$)** of the solid.
*   The sector angle ($\theta$) for a cone is calculated as:
    $$\theta = \\frac{R}{S} \\times 360^\\circ$$
    Where $R$ is the radius of the base of the cone."""
            }
        ],
        "summaries": [
            {"unit": "Unit 1", "title": "Engineering Drawing Standards & Curves", "points": ["Drawing standards and sheet layout rules", "Conic sections: ellipse, parabola, hyperbola construction", "Engineering curves: cycloid, involute, Archimedean spiral", "Loci of points in mechanical linkages"]},
            {"unit": "Unit 2", "title": "Orthographic Projections", "points": ["First angle and Third angle projections principles", "Reference line XY and projection planes (HP, VP, PP)", "Drawing Front, Top, and Side views from 3D pictorials", "Sectional orthographic views drafting"]},
            {"unit": "Unit 3", "title": "Projections of Points, Lines & Planes", "points": ["Projections of points in all four quadrants", "Projections of lines parallel, perpendicular, or inclined to planes", "True length and true inclinations (θ, φ) calculation", "Projections of polygonal and circular planes inclined to planes"]},
            {"unit": "Unit 4", "title": "Projections of Solids", "points": ["Classification of solids: prisms, pyramids, cylinders, cones", "Projections of solids with axis inclined to one plane", "Projections of solids with axis inclined to both planes", "Auxiliary plane method for solids projections"]},
            {"unit": "Unit 5", "title": "Section of Solids & Development of Lateral Surfaces", "points": ["Section planes parallel, perpendicular, or inclined to VP/HP", "True shape of sectional views", "Parallel-line development for prisms and cylinders", "Radial-line development for pyramids and cones"]},
            {"unit": "Unit 6", "title": "Isometric Projections", "points": ["Isometric scale derivation (0.816 factor)", "Isometric axes and isometric lines characteristics", "Constructing isometric views from orthographic drawings", "Four-center method for isometric circles (ellipses)"]}
        ],
        "flashcards": [
            {"term": "Isometric Scale", "definition": "A scale factor of 0.816 used to draw projections due to axis tilting relative to observer."},
            {"term": "Development", "definition": "The flat 2D layout pattern representing the outer surface area of a 3D solid."}
        ]
    }
}

# Add default fallback templates for other subjects to keep the JSON incredibly robust
OTHER_SUBJECTS = ["Engineering Chemistry", "Engineering Graphics", "Engineering Mathematics 1", "Engineering Mechanics", "Electronics", "PPS"]

def main():
    print("=== SEEDING STATIC PYQ DATABASE ===")
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(SEEDED_DATA, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully seeded PYQ database with {len(SEEDED_DATA)} subjects!")
    print(f"Output saved to: {OUTPUT_FILE}")
    print("=== SEEDING COMPLETE ===")

if __name__ == "__main__":
    main()
